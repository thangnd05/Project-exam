package com.project_exam.backend.modules.assessment.attempt.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.util.AfterCommitTasks;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;

import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EnhancedResultResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetRepository;
import com.project_exam.backend.modules.assessment.target.service.UserTargetProgressService;
import com.project_exam.backend.modules.certificate.service.CertificateService;
import com.project_exam.backend.modules.assessment.attempt.mapper.UserTestMapper;
import com.project_exam.backend.modules.assessment.attempt.util.AttemptTimeUtil;
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
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
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
    private final EnhancedResultService enhancedResultService;
    private final UserTargetRepository userTargetRepository;
    private final UserTargetProgressService userTargetProgressService;
    private final CertificateService certificateService;

    private static final int LEADERBOARD_TOP_LIMIT = 100;

    private static final String QUICK_CHALLENGE_CODE = "QUICK_CHALLENGE";

    public UserTestResponse toResponse(UserTest userTest) {
        Test test = userTest.getTestId() == null ? null
                : testRepository.findById(userTest.getTestId()).orElse(null);
        return toResponse(userTest, test);
    }

    private UserTestResponse toResponse(UserTest userTest, Test test) {
        return userTestMapper.toResponse(
                userTest,
                test != null ? test.getExamTypeId() : null,
                null,
                test != null ? test.getTitle() : null);
    }

    private Map<String, Test> loadTestsByTestId(Collection<UserTest> userTests) {
        Set<String> testIds = userTests.stream()
                .map(UserTest::getTestId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (testIds.isEmpty()) return Collections.emptyMap();
        return testRepository.findAllById(testIds).stream()
                .collect(Collectors.toMap(Test::getTestId, test -> test));
    }

    private List<UserTestResponse> toResponseListBatched(List<UserTest> userTests) {
        Map<String, Test> testById = loadTestsByTestId(userTests);
        return userTests.stream()
                .map(u -> toResponse(u, testById.get(u.getTestId())))
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
            throw new ConflictException("Bài thi đã được nộp");
        }

        AfterCommitTasks.runQuietly(
                () -> streakService.recordActivity(currentUserId, StreakActivityType.TEST_SUBMIT));

        return finalizeAttempt(userTest, Instant.now());
    }

    /**
     * Chốt một lượt làm bài: chấm điểm rồi chuyển sang COMPLETED.
     *
     * Dùng chung cho nộp bài thủ công và cho việc dọn bài quá giờ mà người dùng không nộp
     * (đóng tab, mất mạng). finishedAt không bao giờ vượt quá hạn làm bài, nếu không thì
     * bài dọn muộn 3 ngày sẽ hiện "làm trong 3 ngày".
     */
    @Transactional
    public UserTest finalizeAttempt(UserTest userTest, Instant now) {
        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));

        Instant deadline = AttemptTimeUtil.deadline(userTest, test.getDurationMinutes());
        userTest.setFinishedAt(deadline != null && now.isAfter(deadline) ? deadline : now);
        userTest.setStatus(UserTest.Status.COMPLETED);

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTest.getUserTestId());
        if (userAnswers.isEmpty()) {
            userTest.setTotalScore(0);
            return userTestRepository.save(userTest);
        }

        ExamType examType = examTypeRepository.findById(test.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType not found"));

        if (userTest.isPractice()) {
            userTest.setTotalScore(scorePractice(userTest, userAnswers, examType));
        } else {
            int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());
            userTest.setTotalScore(
                    testScorer.scoreFullTest(userAnswers, test, examType, totalQuestionsInTest));
        }

        UserTest saved = userTestRepository.save(userTest);
        syncTargetProgressAfterSubmit(saved, test.getExamTypeId());
        issueCertificateAfterSubmit(saved);
        return saved;
    }

    /**
     * Chấm xong thì xét cấp chứng chỉ. Chạy sau khi commit và nuốt lỗi: chứng chỉ là phần
     * thưởng, hỏng thì cũng không được làm lượt nộp bài thất bại.
     */
    private void issueCertificateAfterSubmit(UserTest userTest) {
        if (userTest.getUserId() == null || userTest.isPractice()) {
            return;
        }
        String userTestId = userTest.getUserTestId();
        AfterCommitTasks.runQuietly(() -> certificateService.issueIfEligible(userTestId));
    }

    /**
     * Lượt làm bài quá giờ mà chưa nộp thì tự chốt, trả về true nếu vừa chốt.
     * Không có bước này thì bài treo IN_PROGRESS vĩnh viễn: lần sau bấm "Làm bài" người dùng
     * rơi lại đúng bài đã hết giờ, không lưu được đáp án nào và cũng không mở được lượt mới.
     */
    @Transactional
    public boolean finalizeIfExpired(UserTest userTest) {
        if (userTest == null || userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            return false;
        }
        Integer durationMinutes = testRepository.findById(userTest.getTestId())
                .map(Test::getDurationMinutes)
                .orElse(null);
        if (!AttemptTimeUtil.isExpired(userTest, durationMinutes, Instant.now())) {
            return false;
        }
        finalizeAttempt(userTest, Instant.now());
        return true;
    }

    private void syncTargetProgressAfterSubmit(UserTest userTest, String examTypeId) {
        if (examTypeId == null || userTest.getUserId() == null) {
            return;
        }
        String userId = userTest.getUserId();
        String userTestId = userTest.getUserTestId();
        Instant finishedAt = userTest.getFinishedAt();

        AfterCommitTasks.runQuietly(() -> {
            if (userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId).isEmpty()) {
                return;
            }
            EnhancedResultResponse result = enhancedResultService.getEnhancedResult(userTestId, userId);
            userTargetProgressService.syncPartScoresFromMock(
                    userId, examTypeId, userTestId, finishedAt, result);
            userTargetProgressService.markTargetAchievedIfMet(userId, examTypeId, result);
        });
    }

    private int countQuestionsForPractice(UserTest userTest) {
        Set<String> examPartIds = parsePracticePartIds(userTest.getPracticePartIds());
        if (examPartIds.isEmpty()) {

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

    private int scorePractice(UserTest userTest, List<UserAnswer> userAnswers, ExamType examType) {
        String scoringMethod = examType.getScoringMethod() != null
                ? examType.getScoringMethod().toLowerCase() : "default";
        int practiceTotal = countQuestionsForPractice(userTest);

        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            Set<String> fullyPracticedSkillIds = getFullyPracticedSkillIds(userTest);
            if (!fullyPracticedSkillIds.isEmpty()) {
                return testScorer.scoreToeicForSkills(userAnswers, examType, fullyPracticedSkillIds);
            }
            return testScorer.scoreDefault(userAnswers, practiceTotal);
        }
        if ("aws_scale".equalsIgnoreCase(scoringMethod)) {
            return testScorer.scoreAwsScale(userAnswers, practiceTotal);
        }
        return testScorer.scoreDefault(userAnswers, practiceTotal);
    }

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

    public List<UserTest> findAll() { return userTestRepository.findAll(); }

    public List<UserTestResponse> findAllResponses() {
        return toResponseListBatched(findAll());
    }
    public Optional<UserTest> findById(String id) { return userTestRepository.findById(id); }
    public List<UserTest> findByUserId(String userId) { return userTestRepository.findByUserId(userId); }
    public List<UserTestResponse> findResponsesByUserId(String userId) {
        return toResponseListBatched(findByUserId(userId));
    }

    public List<UserTestResponse> findCompletedResponsesByUserId(String userId, String examTypeId) {
        List<UserTest> completed = userTestRepository
                .findByUserIdAndStatusAndFinishedAtIsNotNullOrderByFinishedAtDesc(userId, UserTest.Status.COMPLETED);
        Map<String, Test> testById = loadTestsByTestId(completed);
        boolean filterByExamType = examTypeId != null && !examTypeId.isBlank();
        return completed.stream()
                .filter(u -> {
                    if (!filterByExamType) return true;
                    Test t = testById.get(u.getTestId());
                    String et = t != null ? t.getExamTypeId() : null;
                    return et == null || et.equals(examTypeId);
                })
                .map(u -> toResponse(u, testById.get(u.getTestId())))
                .toList();
    }

    public PageResponse<UserTestResponse> getMockHistory(String userId, String examTypeId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "finishedAt"));

        Specification<UserTest> spec = Specification.<UserTest>where(null)
                .and((root, q, cb) -> cb.equal(root.get("userId"), userId))
                .and((root, q, cb) -> cb.equal(root.get("status"), UserTest.Status.COMPLETED))

                .and((root, q, cb) -> cb.or(
                        cb.isNull(root.get("mode")),
                        cb.notEqual(root.get("mode"), UserTest.Mode.PRACTICE)));

        List<String> quickTestIds = examCategoryRepository.findByCode(QUICK_CHALLENGE_CODE)
                .map(c -> testRepository.findByExamCategoryId(c.getExamCategoryId()).stream()
                        .map(Test::getTestId).toList())
                .orElseGet(List::of);
        if (!quickTestIds.isEmpty()) {
            spec = spec.and((root, q, cb) -> cb.not(root.get("testId").in(quickTestIds)));
        }

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

    public List<UserTestResponse> findResponsesByTestId(String testId, String currentUserId) {
        requireTestOwnerOrAdmin(testId, currentUserId);
        return toResponseListBatched(findByTestId(testId));
    }
    public UserTest save(UserTest userTest) { return userTestRepository.save(userTest); }
    public UserTestResponse saveResponse(UserTest userTest) { return toResponse(save(userTest)); }

    private void requireTestOwnerOrAdmin(String testId, String currentUserId) {
        if (authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) return;
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        if (currentUserId == null || !currentUserId.equals(test.getCreatedBy())) {
            throw new ForbiddenException("Bạn không có quyền xem dữ liệu của đề này.");
        }
    }
    @Transactional
    public UserTestResponse updateStatusByOwner(String userTestId, String currentUserId, UserTest.Status status) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("userTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền cập nhật bài thi này");
        }
        if (userTest.getStatus() == UserTest.Status.COMPLETED) {
            throw new ConflictException("Bài thi đã nộp, không thể cập nhật trạng thái");
        }
        userTest.setStatus(status);
        return toResponse(userTestRepository.save(userTest));
    }
    public boolean delete(String id, String currentUserId) {
        return userTestRepository.findById(id).map(u -> {
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

        Optional<UserTest> existing = isPractice
                ? userTestRepository
                        .findTopByUserIdAndTestIdAndStatusAndModeAndPracticePartIdsOrderByStartedAtDesc(
                                userId, testId, UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE, practicePartIds)
                : userTestRepository.findActiveUserTest(
                        userId, testId, UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE);
        // Bài dở còn giờ thì vào tiếp; hết giờ thì chốt luôn rồi mở lượt mới bên dưới.
        if (existing.isPresent() && !finalizeIfExpired(existing.get())) {
            return existing.get();
        }

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

        if (!isPractice) {
            Integer maxAttempts = test.getMaxAttempts();
            if (maxAttempts != null && maxAttempts > 0) {
                int completedAttempts = userTestRepository.countCompletedExcludingMode(
                        userId, testId, UserTest.Status.COMPLETED, UserTest.Mode.PRACTICE);
                if (completedAttempts >= maxAttempts) {
                    throw new ForbiddenException("Bạn đã hết số lượt làm bài.");
                }
            }

            if (test.getCostCoins() != null && test.getCostCoins() > 0
                    && !userId.equals(test.getCreatedBy())
                    && !userTestAccessRepository.existsByUserIdAndTestId(userId, testId)) {
                throw new ForbiddenException("Bài này cần mở khoá bằng xu trước khi làm.");
            }
        }

        UserTest newTest = new UserTest();
        newTest.setUserId(userId);
        newTest.setTestId(testId);
        newTest.setStartedAt(Instant.now());
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

    /**
     * Như findActiveUserTest nhưng bài đã quá giờ thì chốt luôn và coi như không còn bài dở,
     * để màn hình "bạn đang có bài làm dở" không mời người dùng quay lại một bài đã chết.
     */
    @Transactional
    public Optional<UserTest> resolveActiveUserTest(String userId, String testId, String modeRaw,
                                                    List<String> examPartIds) {
        return dropIfExpired(findActiveUserTest(userId, testId, modeRaw, examPartIds));
    }

    @Transactional
    public Optional<UserTest> resolveActiveGuestUserTest(String guestSessionId, String testId) {
        return dropIfExpired(findActiveGuestUserTest(guestSessionId, testId));
    }

    private Optional<UserTest> dropIfExpired(Optional<UserTest> active) {
        return active.filter(ut -> !finalizeIfExpired(ut));
    }

    @Transactional
    public UserTest startGuestUserTest(String testId, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) {
            throw new BadRequestException("Thiếu guest session id");
        }
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found with id: " + testId));

        if (test.getExamCategoryId() == null) {
            throw new ForbiddenException("Bài thi này yêu cầu đăng nhập.");
        }
        ExamCategory category = examCategoryRepository.findById(test.getExamCategoryId())
                .orElseThrow(() -> new NotFoundException("ExamCategory not found"));
        if (!Boolean.TRUE.equals(category.getGuestAllowed())) {
            throw new ForbiddenException("Bài thi này yêu cầu đăng nhập.");
        }

        if (test.getClassId() != null) {
            throw new ForbiddenException("Bài thi của lớp yêu cầu đăng nhập.");
        }

        if (test.getCostCoins() != null && test.getCostCoins() > 0) {
            throw new ForbiddenException("Bài trả phí yêu cầu đăng nhập và mở khoá bằng xu.");
        }

        Optional<UserTest> existing = userTestRepository.findActiveGuestUserTest(
                guestSessionId, testId, UserTest.Status.IN_PROGRESS);
        if (existing.isPresent() && !finalizeIfExpired(existing.get())) {
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
        newTest.setStartedAt(Instant.now());
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
            throw new ConflictException("Bài thi đã được nộp");
        }

        userTest.setFinishedAt(Instant.now());
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
                .orElseThrow(() -> new NotFoundException("userTest not found"));
        if (ut.getGuestSessionId() == null || !ut.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return toResponse(ut);
    }

    @Transactional
    public int claimGuestTests(String userId, String guestSessionId) {
        if (userId == null || guestSessionId == null || guestSessionId.isBlank()) return 0;

        List<UserTest> guestTests = userTestRepository.findByGuestSessionId(guestSessionId);
        if (guestTests.isEmpty()) return 0;

        List<UserTest> toSave = new ArrayList<>();
        for (UserTest ut : guestTests) {
            if (ut.getUserId() != null) continue;

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
     * Backstop cho những bài có giờ mà người dùng không bao giờ quay lại: chốt điểm theo đáp án
     * đã lưu được. Luồng tương tác (start / check-active) đã tự xử lý ngay khi người dùng quay
     * lại, job này chỉ để bảng thống kê không đọng bài IN_PROGRESS treo mãi.
     */
    @Transactional
    public int finalizeExpiredTimedAttempts(long staleAfterHours, int batchSize) {
        Instant now = Instant.now();
        List<UserTest> candidates = userTestRepository.findStaleTimedAttempts(
                UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE,
                now.minus(Duration.ofHours(staleAfterHours)),
                org.springframework.data.domain.PageRequest.of(0, batchSize));

        int finalized = 0;
        for (UserTest attempt : candidates) {
            if (finalizeIfExpired(attempt)) finalized++;
        }
        return finalized;
    }

    @Transactional
    public int purgeAbandonedUntimed(long thresholdHours, int batchSize) {
        Instant cutoff = Instant.now().minus(Duration.ofHours(thresholdHours));
        List<UserTest> abandoned = userTestRepository.findAbandonedUntimed(
                UserTest.Status.IN_PROGRESS, UserTest.Mode.PRACTICE, cutoff,
                org.springframework.data.domain.PageRequest.of(0, batchSize));
        if (abandoned.isEmpty()) return 0;

        List<String> ids = abandoned.stream()
                .map(UserTest::getUserTestId)
                .collect(Collectors.toList());
        userAnswerRepository.deleteByUserTestIdIn(ids);
        userTestRepository.deleteAll(abandoned);
        return abandoned.size();
    }

    public List<UserTestResponse> getAttemptsByUserAndTest(String userId, String testId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        if (!isUnlimited && !isEnded) {
            return Collections.emptyList();
        }

        List<UserTest> list = userTestRepository.findByUserIdAndTestIdOrderByStartedAtDesc(userId, testId);
        Map<String, String> userNameById = loadUserNames(list);

        return list.stream()
                .map(u -> userTestMapper.toResponse(u, test.getExamTypeId(), userNameById.get(u.getUserId())))
                .collect(Collectors.toList());
    }

    public TestLeaderboardResponse getAttemptsByTest(String testId, String currentUserId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        requireLeaderboardViewAccess(test, currentUserId);

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        if (!isUnlimited && !isEnded) {
            return leaderboardMapper.toEmpty();
        }

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

        List<UserTestResponse> ranked = bestAttemptByUser.values().stream()
                .map(u -> userTestMapper.toResponse(u, test.getExamTypeId(), userNameById.get(u.getUserId())))
                .sorted(
                        Comparator
                                .comparing(UserTestResponse::getTotalScore, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserTestResponse::getDurationTaken, Comparator.nullsLast(Comparator.naturalOrder()))
                )
                .collect(Collectors.toList());

        TestLeaderboardResponse.MyRank me = null;
        if (currentUserId != null) {
            for (int i = 0; i < ranked.size(); i++) {
                UserTestResponse r = ranked.get(i);
                if (currentUserId.equals(r.getUserId())) {
                    me = leaderboardMapper.toMyRank(
                            i + 1,
                            r.getUserTestId(),
                            r.getTotalScore(),
                            r.getDurationTaken());
                    break;
                }
            }
        }

        List<UserTestResponse> entries = ranked.size() > LEADERBOARD_TOP_LIMIT
                ? new ArrayList<>(ranked.subList(0, LEADERBOARD_TOP_LIMIT))
                : ranked;

        return leaderboardMapper.toResponse(entries, me, ranked.size());
    }

    private void requireLeaderboardViewAccess(Test test, String currentUserId) {
        if (authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) return;
        if (currentUserId == null) {
            throw new ForbiddenException("Bạn cần đăng nhập để xem bảng xếp hạng.");
        }
        if (currentUserId.equals(test.getCreatedBy())) return;

        String classId = test.getClassId();
        if (classId == null || classId.isBlank()) {
            return;
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

    public UserTestResponse getMeta(String userTestId, String currentUserId) {
        var ut = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("userTest not found"));

        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
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
