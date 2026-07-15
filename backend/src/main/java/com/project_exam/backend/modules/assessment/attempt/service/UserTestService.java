package com.project_exam.backend.modules.assessment.attempt.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import jakarta.servlet.http.HttpServletRequest;

import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.mapper.UserTestMapper;
import com.project_exam.backend.modules.assessment.attempt.mapper.LeaderboardMapper;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.users.user.domain.*;
import com.project_exam.backend.modules.users.rbac.domain.*;
import com.project_exam.backend.modules.posts.post.domain.*;
import com.project_exam.backend.modules.posts.comment.domain.*;
import com.project_exam.backend.modules.posts.category.domain.*;
import com.project_exam.backend.modules.posts.react.domain.*;
import com.project_exam.backend.modules.posts.saved.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.album.domain.*;
import com.project_exam.backend.modules.vocabulary.word.domain.*;
import com.project_exam.backend.modules.vocabulary.learning.domain.*;
import com.project_exam.backend.modules.vocabulary.lookup.domain.*;
import com.project_exam.backend.modules.classroom.clazz.domain.*;
import com.project_exam.backend.modules.classroom.chapter.domain.*;
import com.project_exam.backend.modules.classroom.member.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.user.repository.*;
import com.project_exam.backend.modules.users.rbac.repository.*;
import com.project_exam.backend.modules.posts.post.repository.*;
import com.project_exam.backend.modules.posts.comment.repository.*;
import com.project_exam.backend.modules.posts.category.repository.*;
import com.project_exam.backend.modules.posts.react.repository.*;
import com.project_exam.backend.modules.posts.saved.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.album.repository.*;
import com.project_exam.backend.modules.vocabulary.word.repository.*;
import com.project_exam.backend.modules.vocabulary.learning.repository.*;
import com.project_exam.backend.modules.classroom.clazz.repository.*;
import com.project_exam.backend.modules.classroom.chapter.repository.*;
import com.project_exam.backend.modules.classroom.member.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserTestService {

    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestRepository testRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final TestScorer testScorer;
    private final ExamPartRepository examPartRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final UserRepository userRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final AuthUtils authUtils;
    private final StreakService streakService;
    private final UserTestAccessRepository userTestAccessRepository;
    private final UserTestMapper userTestMapper;
    private final LeaderboardMapper leaderboardMapper;

    private static final int LEADERBOARD_TOP_LIMIT = 100;

    /** Code ExamCategory của Quick Challenge — bài này không có điểm tổng chuẩn nên loại khỏi lịch sử mock. */
    private static final String QUICK_CHALLENGE_CODE = "QUICK_CHALLENGE";

    public UserTestResponse toResponse(UserTest userTest) {
        String examTypeId = testRepository.findById(userTest.getTestId())
                .map(Test::getExamTypeId)
                .orElse(null);
        return toResponse(userTest, examTypeId);
    }

    private UserTestResponse toResponse(UserTest userTest, String examTypeId) {
        return userTestMapper.toResponse(userTest, examTypeId, null);
    }

    /** Batch-load examTypeId theo testId để tránh N+1 khi map list UserTest. */
    private Map<String, String> loadExamTypeIdsByTestId(Collection<UserTest> userTests) {
        Set<String> testIds = userTests.stream()
                .map(UserTest::getTestId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (testIds.isEmpty()) return Collections.emptyMap();
        return testRepository.findAllById(testIds).stream()
                .collect(Collectors.toMap(Test::getTestId, Test::getExamTypeId));
    }

    private List<UserTestResponse> toResponseListBatched(List<UserTest> userTests) {
        Map<String, String> examTypeIdByTest = loadExamTypeIdsByTestId(userTests);
        return userTests.stream()
                .map(u -> toResponse(u, examTypeIdByTest.get(u.getTestId())))
                .toList();
    }

    @Transactional
    public UserTest submitTest(String userTestId, String currentUserId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền nộp bài thi này");
        }
        if (userTest.getStatus() == UserTest.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã được nộp");
        }

        userTest.setFinishedAt(LocalDateTime.now());
        userTest.setStatus(UserTest.Status.COMPLETED); // Cập nhật trạng thái đã nộp

        // Ghi nhận streak (side-effect, không được làm hỏng luồng nộp bài)
        try {
            streakService.recordActivity(currentUserId, StreakActivityType.TEST_SUBMIT);
        } catch (Exception ignored) {
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            userTest.setTotalScore(0);
            return userTestRepository.save(userTest);
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));

        ExamType examType = examTypeRepository.findById(test.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType not found"));

        // Luyện tập theo Part: quy đổi TOEIC cho kỹ năng được luyện TRỌN section,
        // còn lại chấm thang % (xem scorePractice).
        if (userTest.isPractice()) {
            userTest.setTotalScore(scorePractice(userTest, userAnswers, examType));
            return userTestRepository.save(userTest);
        }

        int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());
        int totalScore = testScorer.scoreFullTest(userAnswers, test, examType, totalQuestionsInTest);

        userTest.setTotalScore(totalScore);
        return userTestRepository.save(userTest);
    }

    /** Tổng số câu của các Part được luyện (mẫu số chấm % cho mode PRACTICE). */
    private int countQuestionsForPractice(UserTest userTest) {
        Set<String> examPartIds = parsePracticePartIds(userTest.getPracticePartIds());
        if (examPartIds.isEmpty()) {
            // Không rõ Part -> fallback về toàn bộ đề để không chia cho 0.
            return calculateTotalQuestionsInTest(userTest.getTestId());
        }
        List<String> testPartIds = testPartRepository.findByTestId(userTest.getTestId()).stream()
                .filter(tp -> examPartIds.contains(tp.getExamPartId()))
                .map(TestPart::getTestPartId)
                .toList();
        if (testPartIds.isEmpty()) {
            return calculateTotalQuestionsInTest(userTest.getTestId());
        }
        return (int) testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
    }

    private Set<String> parsePracticePartIds(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptySet();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * Chấm điểm mode PRACTICE — chấm theo đúng phương pháp của dạng đề (giống full test),
     * chỉ giới hạn phạm vi vào các Part đã luyện:
     * - TOEIC (toeic_scale): kỹ năng nào được luyện TRỌN (đủ mọi Part của kỹ năng đó trong
     *   đề) thì quy đổi điểm thang (Listening/Reading tối đa 495). Kỹ năng luyện lẻ vài Part
     *   không quy đổi được (bảng quy đổi giả định làm đủ section) -> fallback thang %.
     * - AWS (aws_scale): thang scaled 100–1000 trên số câu của các Part đã luyện.
     * - Khác (default): thang % (số câu đúng / tổng câu đã luyện).
     */
    private int scorePractice(UserTest userTest, List<UserAnswer> userAnswers, ExamType examType) {
        String scoringMethod = examType.getScoringMethod() != null
                ? examType.getScoringMethod().toLowerCase() : "default";
        int practiceTotal = countQuestionsForPractice(userTest);

        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            Set<String> fullyPracticedSkillIds = getFullyPracticedSkillIds(userTest);
            if (!fullyPracticedSkillIds.isEmpty()) {
                return testScorer.scoreToeicForSkills(userAnswers, examType, fullyPracticedSkillIds);
            }
            return testScorer.scoreDefault(userAnswers, practiceTotal); // luyện lẻ chưa đủ section -> %
        }
        if ("aws_scale".equalsIgnoreCase(scoringMethod)) {
            return testScorer.scoreAwsScale(userAnswers, practiceTotal);
        }
        return testScorer.scoreDefault(userAnswers, practiceTotal);
    }

    /**
     * Các kỹ năng (skillId) được luyện TRỌN: mọi Part của kỹ năng đó có trong đề
     * đều nằm trong danh sách Part đã chọn luyện.
     */
    private Set<String> getFullyPracticedSkillIds(UserTest userTest) {
        Set<String> practicedPartIds = parsePracticePartIds(userTest.getPracticePartIds());
        if (practicedPartIds.isEmpty()) return Collections.emptySet();

        Set<String> testExamPartIds = testPartRepository.findByTestId(userTest.getTestId()).stream()
                .map(TestPart::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, String> partToSkill = examPartRepository.findAllById(testExamPartIds).stream()
                .filter(ep -> ep.getSkillId() != null)
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getSkillId));

        // Nhóm examPartId (trong đề) theo skill.
        Map<String, Set<String>> skillToParts = new HashMap<>();
        for (String partId : testExamPartIds) {
            String skillId = partToSkill.get(partId);
            if (skillId == null) continue;
            skillToParts.computeIfAbsent(skillId, k -> new HashSet<>()).add(partId);
        }

        Set<String> fullyPracticed = new HashSet<>();
        for (Map.Entry<String, Set<String>> e : skillToParts.entrySet()) {
            if (practicedPartIds.containsAll(e.getValue())) {
                fullyPracticed.add(e.getKey());
            }
        }
        return fullyPracticed;
    }

    private int calculateTotalQuestionsInTest(String testId) {
        List<String> testPartIds = testPartRepository.findByTestId(testId).stream()
                .map(TestPart::getTestPartId)
                .toList();
        if (testPartIds.isEmpty()) {
            return 0;
        }
        return (int) testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
    }

    // --- Các phương thức CRUD khác ---
    public List<UserTest> findAll() { return userTestRepository.findAll(); }

    /** Chỉ admin được liệt kê toàn bộ user-tests. */
    public List<UserTestResponse> findAllResponses(jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
            throw new ForbiddenException("Chỉ admin được xem toàn bộ user-tests.");
        }
        return toResponseListBatched(findAll());
    }
    public Optional<UserTest> findById(String id) { return userTestRepository.findById(id); }
    public List<UserTest> findByUserId(String userId) { return userTestRepository.findByUserId(userId); }
    public List<UserTestResponse> findResponsesByUserId(String userId) {
        return toResponseListBatched(findByUserId(userId));
    }

    /**
     * Lịch sử mock (phân trang) cho trang Lịch sử bài thi: bỏ PRACTICE và Quick Challenge,
     * chỉ giữ bài làm đề đầy đủ có điểm tổng chuẩn. examTypeId null/blank = tất cả kỳ thi.
     * Dùng Specification + findAll(spec, pageable) như các trang phân trang khác (UserService).
     */
    public PageResponse<UserTestResponse> getMockHistory(String userId, String examTypeId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "finishedAt"));

        Specification<UserTest> spec = Specification.<UserTest>where(null)
                .and((root, q, cb) -> cb.equal(root.get("userId"), userId))
                .and((root, q, cb) -> cb.equal(root.get("status"), UserTest.Status.COMPLETED))
                // Bỏ luyện tập theo Part; mode NULL (dữ liệu cũ) coi như full nên vẫn giữ.
                .and((root, q, cb) -> cb.or(
                        cb.isNull(root.get("mode")),
                        cb.notEqual(root.get("mode"), UserTest.Mode.PRACTICE)));

        // Bỏ Quick Challenge (đề ngắn, không có điểm tổng chuẩn) — lọc theo testId thuộc category đó.
        List<String> quickTestIds = examCategoryRepository.findByCode(QUICK_CHALLENGE_CODE)
                .map(c -> testRepository.findByExamCategoryId(c.getExamCategoryId()).stream()
                        .map(Test::getTestId).toList())
                .orElseGet(List::of);
        if (!quickTestIds.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.not(root.get("testId").in(quickTestIds)));
        }

        // Lọc theo kỳ thi (nếu có) — không có test nào thì trả trang rỗng.
        if (examTypeId != null && !examTypeId.isBlank()) {
            List<String> examTypeTestIds = testRepository.findByExamTypeId(examTypeId).stream()
                    .map(Test::getTestId).toList();
            spec = spec.and((root, q, cb) ->
                    examTypeTestIds.isEmpty() ? cb.disjunction() : root.get("testId").in(examTypeTestIds));
        }

        Page<UserTest> result = userTestRepository.findAll(spec, pageable);
        return PageResponse.from(result, toResponseListBatched(result.getContent()));
    }
    public List<UserTest> findByTestId(String testId) { return userTestRepository.findByTestId(testId); }

    /** Chỉ chủ đề (hoặc admin) được xem toàn bộ attempts của một bài test. */
    public List<UserTestResponse> findResponsesByTestId(String testId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        requireTestOwnerOrAdmin(testId, httpRequest);
        return toResponseListBatched(findByTestId(testId));
    }
    public UserTest save(UserTest userTest) { return userTestRepository.save(userTest); }
    public UserTestResponse saveResponse(UserTest userTest) { return toResponse(save(userTest)); }

    private void requireTestOwnerOrAdmin(String testId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) return;
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null || !currentUserId.equals(test.getCreatedBy())) {
            throw new ForbiddenException("Bạn không có quyền xem dữ liệu của đề này.");
        }
    }
    @Transactional
    public UserTestResponse updateStatusByOwner(String userTestId, String currentUserId, UserTest.Status status) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "userTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền cập nhật bài thi này");
        }
        if (userTest.getStatus() == UserTest.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã nộp, không thể cập nhật trạng thái");
        }
        userTest.setStatus(status);
        return toResponse(userTestRepository.save(userTest));
    }
    public boolean delete(String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return userTestRepository.findById(id).map(u -> {
            String currentUserId = authUtils.getUserId(httpRequest);
            boolean isOwner = currentUserId != null && currentUserId.equals(u.getUserId());
            if (!isOwner && !authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
                throw new ForbiddenException("Bạn không có quyền xoá bài làm này.");
            }
            userTestRepository.delete(u);
            return true;
        }).orElse(false);
    }

    @Transactional
    public UserTest startUserTest(String testId, String userId) {
        return startUserTest(testId, userId, null, null);
    }

    @Transactional
    public UserTest startUserTest(String testId, String userId, String modeRaw, List<String> examPartIds) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found with id: " + testId));

        UserTest.Mode mode = parseMode(modeRaw);
        boolean isPractice = mode == UserTest.Mode.PRACTICE;
        String practicePartIds = isPractice ? normalizeParts(examPartIds) : null;

        //  RESUME: nếu user đã có attempt đang làm dở, trả về luôn — không áp dụng
        // các guard time-window/max-attempts nữa, vì user đã start hợp lệ trước đó.
        // (Class membership cũng skip cho resume — user vào lớp rồi rời ra vẫn được hoàn thành.)
        // Practice resume phải khớp đúng bộ Part để không lẫn với full test / bộ Part khác.
        Optional<UserTest> existing = isPractice
                ? userTestRepository
                        .findTopByUserIdAndTestIdAndStatusAndModeAndPracticePartIdsOrderByStartedAtDesc(
                                userId, testId, UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE, practicePartIds)
                : userTestRepository.findActiveUserTest(
                        userId, testId, UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE);
        if (existing.isPresent()) {
            return existing.get();
        }

        //  Tạo NEW attempt: phải pass mọi guard.
        if (test.getClassId() != null) {
            boolean isMember = classMemberRepository.existsByClassIdAndUserIdAndStatus(
                    test.getClassId(), userId, MemberStatus.APPROVED);
            boolean isTeacher = classRepository.existsByClassIdAndTeacherId(test.getClassId(), userId);
            if (!isMember && !isTeacher) {
                throw new ForbiddenException("Bạn không thuộc lớp của bài kiểm tra này.");
            }
        }
        TestStatus status = test.calculateStatus();
        if (status == TestStatus.NOT_STARTED) {
            throw new ForbiddenException("Bài kiểm tra chưa mở.");
        }
        if (status == TestStatus.ENDED) {
            throw new ForbiddenException("Bài kiểm tra đã kết thúc.");
        }

        // Luyện tập theo Part: MIỄN PHÍ, KHÔNG tốn lượt -> bỏ qua guard maxAttempts & xu.
        if (!isPractice) {
            Integer maxAttempts = test.getMaxAttempts();
            if (maxAttempts != null && maxAttempts > 0) {
                int completedAttempts = userTestRepository.countCompletedExcludingMode(
                        userId, testId, UserTest.Status.COMPLETED, UserTest.Mode.PRACTICE);
                if (completedAttempts >= maxAttempts) {
                    throw new ForbiddenException("Bạn đã hết số lượt làm bài.");
                }
            }

            // Bài trả phí: phải đã mua quyền (người tạo được miễn). Resume ở trên không qua đây.
            if (test.getCostCoins() != null && test.getCostCoins() > 0
                    && !userId.equals(test.getCreatedBy())
                    && !userTestAccessRepository.existsByUserIdAndTestId(userId, testId)) {
                throw new ForbiddenException("Bài này cần mở khoá bằng xu trước khi làm.");
            }
        }

        //  Tạo mới user_test
        UserTest newTest = new UserTest();
        newTest.setUserId(userId);
        newTest.setTestId(testId);
        newTest.setStartedAt(LocalDateTime.now());
        newTest.setStatus(UserTest.Status.IN_PROGRESS);
        newTest.setTotalScore(0);
        newTest.setMode(mode);
        newTest.setPracticePartIds(practicePartIds);

        return userTestRepository.save(newTest);
    }

    private UserTest.Mode parseMode(String raw) {
        if (raw == null || raw.isBlank()) return UserTest.Mode.FULL_TEST;
        try {
            return UserTest.Mode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserTest.Mode.FULL_TEST;
        }
    }

    /** Chuẩn hoá danh sách examPartId thành CSV đã sort/distinct để so khớp resume ổn định. */
    private String normalizeParts(List<String> examPartIds) {
        if (examPartIds == null || examPartIds.isEmpty()) return null;
        String csv = examPartIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.joining(","));
        return csv.isEmpty() ? null : csv;
    }

    public Optional<UserTest> findActiveUserTest(String userId, String testId) {
        return userTestRepository.findActiveUserTest(
                userId, testId, UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE);
    }

    /** Resume tra cứu theo mode (dùng cho check-active): practice cần đúng bộ Part. */
    public Optional<UserTest> findActiveUserTest(String userId, String testId, String modeRaw, List<String> examPartIds) {
        if (parseMode(modeRaw) == UserTest.Mode.PRACTICE) {
            return userTestRepository
                    .findTopByUserIdAndTestIdAndStatusAndModeAndPracticePartIdsOrderByStartedAtDesc(
                            userId, testId, UserTest.Status.IN_PROGRESS,
                            UserTest.Mode.PRACTICE, normalizeParts(examPartIds));
        }
        return findActiveUserTest(userId, testId);
    }

    public Optional<UserTest> findActiveGuestUserTest(String guestSessionId, String testId) {
        return userTestRepository.findActiveGuestUserTest(guestSessionId, testId, UserTest.Status.IN_PROGRESS);
    }

    // ===== GUEST FLOW =====

    @Transactional
    public UserTest startGuestUserTest(String testId, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu guest session id");
        }
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found with id: " + testId));

        // Bắt buộc test phải thuộc ExamCategory cho phép guest.
        if (test.getExamCategoryId() == null) {
            throw new ForbiddenException("Bài thi này yêu cầu đăng nhập.");
        }
        ExamCategory category = examCategoryRepository.findById(test.getExamCategoryId())
                .orElseThrow(() -> new NotFoundException("ExamCategory not found"));
        if (!Boolean.TRUE.equals(category.getGuestAllowed())) {
            throw new ForbiddenException("Bài thi này yêu cầu đăng nhập.");
        }
        // Guest không hỗ trợ test gắn lớp.
        if (test.getClassId() != null) {
            throw new ForbiddenException("Bài thi của lớp yêu cầu đăng nhập.");
        }
        // Guest không mua được bài trả phí (không có ví xu).
        if (test.getCostCoins() != null && test.getCostCoins() > 0) {
            throw new ForbiddenException("Bài trả phí yêu cầu đăng nhập và mở khoá bằng xu.");
        }

        //  RESUME: nếu guest session đã có attempt đang dở thì trả về luôn.
        Optional<UserTest> existing = userTestRepository.findActiveGuestUserTest(
                guestSessionId, testId, UserTest.Status.IN_PROGRESS);
        if (existing.isPresent()) {
            return existing.get();
        }

        TestStatus status = test.calculateStatus();
        if (status == TestStatus.NOT_STARTED) {
            throw new ForbiddenException("Bài kiểm tra chưa mở.");
        }
        if (status == TestStatus.ENDED) {
            throw new ForbiddenException("Bài kiểm tra đã kết thúc.");
        }

        UserTest newTest = new UserTest();
        newTest.setUserId(null);
        newTest.setGuestSessionId(guestSessionId);
        newTest.setTestId(testId);
        newTest.setStartedAt(LocalDateTime.now());
        newTest.setStatus(UserTest.Status.IN_PROGRESS);
        newTest.setTotalScore(0);
        return userTestRepository.save(newTest);
    }

    @Transactional
    public UserTest submitGuestTest(String userTestId, String guestSessionId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        if (userTest.getStatus() == UserTest.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã được nộp");
        }

        userTest.setFinishedAt(LocalDateTime.now());
        userTest.setStatus(UserTest.Status.COMPLETED);

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            userTest.setTotalScore(0);
            return userTestRepository.save(userTest);
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));
        ExamType examType = examTypeRepository.findById(test.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType not found"));

        int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());
        int totalScore = testScorer.scoreFullTest(userAnswers, test, examType, totalQuestionsInTest);

        userTest.setTotalScore(totalScore);
        return userTestRepository.save(userTest);
    }

    public UserTestResponse getMetaForGuest(String userTestId, String guestSessionId) {
        UserTest ut = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "userTest not found"));
        if (ut.getGuestSessionId() == null || !ut.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return toResponse(ut);
    }

    /**
     * Gắn (claim) các bài làm của phiên guest vào tài khoản vừa đăng nhập.
     * Gọi ngay sau khi login/OAuth thành công: mọi UserTest có guestSessionId này
     * (cả IN_PROGRESS đang làm dở lẫn COMPLETED đã nộp) sẽ chuyển về userId để
     * hiện trong lịch sử và cho phép làm tiếp. Idempotent: chạy lại là no-op vì
     * guestSessionId đã bị xoá khỏi các bài đã claim.
     */
    @Transactional
    public int claimGuestTests(String userId, String guestSessionId) {
        if (userId == null || guestSessionId == null || guestSessionId.isBlank()) return 0;

        List<UserTest> guestTests = userTestRepository.findByGuestSessionId(guestSessionId);
        if (guestTests.isEmpty()) return 0;

        List<UserTest> toSave = new ArrayList<>();
        for (UserTest ut : guestTests) {
            if (ut.getUserId() != null) continue; // đã có chủ, không đụng vào

            // Tránh 2 attempt IN_PROGRESS cùng (user, test) làm hỏng resume
            // (findActiveUserTest trả Optional): nếu user đã có bài dở cho đề này
            // thì đánh dấu bài guest là EXPIRED — vẫn giữ lịch sử, không xung đột.
            if (ut.getStatus() == UserTest.Status.IN_PROGRESS
                    && findActiveUserTest(userId, ut.getTestId()).isPresent()) {
                ut.setStatus(UserTest.Status.EXPIRED);
            }

            ut.setUserId(userId);
            ut.setGuestSessionId(null);
            toSave.add(ut);
        }

        if (!toSave.isEmpty()) userTestRepository.saveAll(toSave);
        return toSave.size();
    }

    /**
     * Dọn MỘT LÔ bài làm dở của đề KHÔNG giới hạn giờ (không tự nộp được) đã quá ngưỡng.
     * Xoá hẳn UserTest + UserAnswer để tránh phình DB bởi các attempt bỏ ngang.
     * Mỗi lời gọi = 1 transaction nhỏ (tối đa `batchSize` bản ghi) không bao giờ ôm
     * giao dịch khổng lồ. Scheduler lặp gọi tới khi hết (có trần số lô/lần chạy).
     * Trả về số bản ghi đã xoá trong lô này (0 = đã hết). Bài CÓ giờ không đụng tới.
     */
    @Transactional
    public int purgeAbandonedUntimed(long thresholdHours, int batchSize) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(thresholdHours);
        List<UserTest> abandoned = userTestRepository.findAbandonedUntimed(
                UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE, cutoff,
                org.springframework.data.domain.PageRequest.of(0, batchSize));
        if (abandoned.isEmpty()) return 0;

        List<String> ids = abandoned.stream()
                .map(UserTest::getUserTestId)
                .collect(Collectors.toList());
        userAnswerRepository.deleteByUserTestIdIn(ids); // xoá answers trước (FK)
        userTestRepository.deleteAll(abandoned);
        return abandoned.size();
    }

    public List<UserTestResponse> getAttemptsByUserAndTest(String userId, String testId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
    
        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;
    
        // chỉ chặn khi có giới hạn thời gian nhưng chưa hết
        if (!isUnlimited && !isEnded) {
            return Collections.emptyList();
        }
    
        List<UserTest> list = userTestRepository.findByUserIdAndTestIdOrderByStartedAtDesc(userId, testId);
        Map<String, String> userNameById = loadUserNames(list);

        return list.stream()
                .map(u -> userTestMapper.toResponse(u, test.getExamTypeId(), userNameById.get(u.getUserId())))
                .collect(Collectors.toList());
    }

    public TestLeaderboardResponse getAttemptsByTest(String testId,HttpServletRequest httpRequest) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        //  Đề của lớp -> chỉ thành viên lớp xem; đề public theo exam_type -> mọi user đăng nhập xem được.
        requireLeaderboardViewAccess(test, httpRequest);

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        //  chỉ chặn khi có giới hạn thời gian nhưng chưa hết
        if (!isUnlimited && !isEnded) {
            return leaderboardMapper.toEmpty();
        }

        // Bảng xếp hạng CHỈ tính lượt full-test; loại các lượt luyện tập theo Part.
        // (mode NULL của dữ liệu cũ != PRACTICE -> vẫn được giữ.)
        List<UserTest> list = userTestRepository.findByTestIdAndStatus(testId, UserTest.Status.COMPLETED).stream()
                .filter(u -> u.getMode() != UserTest.Mode.PRACTICE)
                .toList();
        Map<String, UserTest> bestAttemptByUser = new HashMap<>();
        for (UserTest attempt : list) {
            String userId = attempt.getUserId();
            UserTest currentBest = bestAttemptByUser.get(userId);

            if (currentBest == null || isBetterAttempt(attempt, currentBest)) {
                bestAttemptByUser.put(userId, attempt);
            }
        }
        Map<String, String> userNameById = loadUserNames(bestAttemptByUser.values());

        // Toàn bộ bảng đã xếp hạng (chưa cắt) — dùng để tính hạng thật của người xem.
        List<UserTestResponse> ranked = bestAttemptByUser.values().stream()
                .map(u -> userTestMapper.toResponse(u, test.getExamTypeId(), userNameById.get(u.getUserId())))
                .sorted(
                        Comparator
                                .comparing(UserTestResponse::getTotalScore, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserTestResponse::getDurationTaken, Comparator.nullsLast(Comparator.naturalOrder()))
                )
                .collect(Collectors.toList());

        // Hạng của chính người đang xem — tính trên TOÀN bảng (kể cả khi nằm ngoài top hiển thị).
        TestLeaderboardResponse.MyRank me = null;
        String viewerId = authUtils.getUserId(httpRequest);
        if (viewerId != null) {
            for (int i = 0; i < ranked.size(); i++) {
                UserTestResponse r = ranked.get(i);
                if (viewerId.equals(r.getUserId())) {
                    me = leaderboardMapper.toMyRank(
                            i + 1,
                            r.getUserTestId(),
                            r.getTotalScore(),
                            r.getDurationTaken());
                    break;
                }
            }
        }

        // Chỉ trả top N để giảm payload/độ nặng khi render; me vẫn giữ hạng thật ở trên.
        List<UserTestResponse> entries = ranked.size() > LEADERBOARD_TOP_LIMIT
                ? new ArrayList<>(ranked.subList(0, LEADERBOARD_TOP_LIMIT))
                : ranked;

        return leaderboardMapper.toResponse(entries, me, ranked.size());
    }

    /**
     * Quyền xem bảng xếp hạng của 1 đề:
     * - Admin / người tạo đề: luôn xem được.
     * - Đề thuộc lớp (classId != null): chỉ giáo viên lớp hoặc thành viên đã được duyệt.
     * - Đề public theo exam_type (classId == null): mọi user đã đăng nhập đều xem được.
     */
    private void requireLeaderboardViewAccess(Test test, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) return;

        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new ForbiddenException("Bạn cần đăng nhập để xem bảng xếp hạng.");
        }
        if (currentUserId.equals(test.getCreatedBy())) return;

        String classId = test.getClassId();
        if (classId == null || classId.isBlank()) {
            return; // đề public -> ai đăng nhập cũng xem được
        }

        boolean isTeacher = classRepository.existsByClassIdAndTeacherId(classId, currentUserId);
        boolean isMember = classMemberRepository
                .existsByClassIdAndUserIdAndStatus(classId, currentUserId, MemberStatus.APPROVED);
        if (!isTeacher && !isMember) {
            throw new ForbiddenException("Bạn không thuộc lớp này nên không xem được bảng xếp hạng.");
        }
    }

    private boolean isBetterAttempt(UserTest candidate, UserTest currentBest) {
        int candidateScore = candidate.getTotalScore() != null ? candidate.getTotalScore() : Integer.MIN_VALUE;
        int currentBestScore = currentBest.getTotalScore() != null ? currentBest.getTotalScore() : Integer.MIN_VALUE;

        if (candidateScore != currentBestScore) {
            return candidateScore > currentBestScore;
        }

        Long candidateDuration = getDurationTaken(candidate);
        Long currentBestDuration = getDurationTaken(currentBest);
        return candidateDuration < currentBestDuration;
    }

    private long getDurationTaken(UserTest userTest) {
        if (userTest.getStartedAt() == null || userTest.getFinishedAt() == null) {
            return Long.MAX_VALUE;
        }
        return Duration.between(userTest.getStartedAt(), userTest.getFinishedAt()).getSeconds();
    }

    public UserTestResponse getMeta(String userTestId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        var ut = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "userTest not found"));
        //  Chỉ user sở hữu attempt, chủ đề (giáo viên), hoặc admin được xem.
        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
            String currentUserId = authUtils.getUserId(httpRequest);
            boolean isOwner = currentUserId != null && currentUserId.equals(ut.getUserId());
            boolean isTestOwner = false;
            if (!isOwner && currentUserId != null) {
                Test test = testRepository.findById(ut.getTestId()).orElse(null);
                isTestOwner = test != null && currentUserId.equals(test.getCreatedBy());
            }
            if (!isOwner && !isTestOwner) {
                throw new ForbiddenException("Bạn không có quyền xem bài làm này.");
            }
        }
        String examTypeId = testRepository.findById(ut.getTestId())
                .map(Test::getExamTypeId)
                .orElse(null);
        return userTestMapper.toResponse(ut, examTypeId, resolveUserName(ut.getUserId()));
    }

    private Map<String, String> loadUserNames(Collection<UserTest> attempts) {
        Set<String> userIds = attempts.stream()
                .map(UserTest::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getUserName));
    }

    private String resolveUserName(String userId) {
        return userRepository.findById(userId)
                .map(User::getUserName)
                .orElse(null);
    }

}