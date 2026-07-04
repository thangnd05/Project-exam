package com.project_exam.backend.modules.assessment.attempt.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.modules.classroom.domain.ClassMember.MemberStatus;
import jakarta.servlet.http.HttpServletRequest;

import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.mapper.UserTestMapper;
import com.project_exam.backend.modules.assessment.attempt.mapper.LeaderboardMapper;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.users.domain.*;
import com.project_exam.backend.modules.posts.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.domain.*;
import com.project_exam.backend.modules.classroom.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.repository.*;
import com.project_exam.backend.modules.posts.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;


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
    private final AnswerRepository answerRepository;
    private final TestRepository testRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final ScoringConversionRepository scoringConversionRepository;
    private final QuestionRepository questionRepository;
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
        userTest.setStatus(UserTest.Status.COMPLETED); // 🟢 Cập nhật trạng thái đã nộp

        // 🔥 Ghi nhận streak (side-effect, không được làm hỏng luồng nộp bài)
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

        // Luyện tập theo Part: luôn chấm thang % (đúng/tổng-câu-của-Part-đã-chọn),
        // không quy đổi TOEIC/AWS vì bảng quy đổi giả định làm đủ cả section.
        if (userTest.isPractice()) {
            int practiceTotal = countQuestionsForPractice(userTest);
            userTest.setTotalScore(scoreDefault(userAnswers, practiceTotal));
            return userTestRepository.save(userTest);
        }

        String scoringMethod = examType.getScoringMethod() != null ? examType.getScoringMethod().toLowerCase() : "default";
        int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());

        int totalScore;
        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            totalScore = scoreToeicOptimal(userAnswers, test, examType);
        } else if ("aws_scale".equalsIgnoreCase(scoringMethod)) {
            totalScore = scoreAwsScale(userAnswers, totalQuestionsInTest);
        } else {
            totalScore = scoreDefault(userAnswers, totalQuestionsInTest);
        }

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

    private int scoreDefault(List<UserAnswer> userAnswers, int totalQuestionsInTest) {
        if (userAnswers.isEmpty()) {
            return 0;
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        int totalQuestions = totalQuestionsInTest > 0 ? totalQuestionsInTest
                : (int) uniqueAnswers.stream().map(UserAnswer::getQuestionId).distinct().count();
        if (totalQuestions == 0) {
            return 0;
        }
        int correctCount = countCorrectAnswers(uniqueAnswers);
        // Tính điểm theo thang 100: (số câu đúng / tổng số câu) * 100
        return (int) Math.round((double) correctCount / totalQuestions * 100);
    }

    /**
     * Thang điểm kiểu AWS (scaled 100–1000): Score = 100 + (số câu đúng / tổng câu) * 900.
     * Tổng câu = số câu thực tế của đề (vd AWS = 65). Kết quả kẹp trong [100, 1000].
     */
    private int scoreAwsScale(List<UserAnswer> userAnswers, int totalQuestionsInTest) {
        if (userAnswers.isEmpty()) {
            return 100;
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        int totalQuestions = totalQuestionsInTest > 0 ? totalQuestionsInTest
                : (int) uniqueAnswers.stream().map(UserAnswer::getQuestionId).distinct().count();
        if (totalQuestions == 0) {
            return 100;
        }
        int correctCount = countCorrectAnswers(uniqueAnswers);
        int score = 100 + (int) Math.round((double) correctCount / totalQuestions * 900);
        return Math.max(100, Math.min(1000, score));
    }

    /** Đếm số câu đúng (MCQ/MSQ/FILL) trong danh sách đáp án (đã dedup). */
    private int countCorrectAnswers(List<UserAnswer> uniqueAnswers) {
        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());
        if (questionIds.isEmpty()) return 0;

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));
        Map<String, List<Answer>> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        int correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            Question question = questionMap.get(userAnswer.getQuestionId());
            List<Answer> correctAnswers = correctAnswersMap.get(userAnswer.getQuestionId());
            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) {
                continue;
            }
            if (AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    userAnswer.getSelectedAnswerId(), userAnswer.getSelectedAnswerIds(),
                    userAnswer.getAnswerText(), correctAnswers)) {
                correctCount++;
            }
        }
        return correctCount;
    }

    private int scoreToeicOptimal(List<UserAnswer> userAnswers, Test test, ExamType examType) {
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        // 1. Lấy thông tin Question đầy đủ
        List<String> allQuestionIds = uniqueAnswers.stream().map(UserAnswer::getQuestionId).toList();
        List<Question> questions = questionRepository.findAllById(allQuestionIds);
        Map<String, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        // 2. Lấy thông tin đáp án đúng đầy đủ
        Map<String, List<Answer>> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(allQuestionIds)
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        // 3. Lấy thông tin ExamPart và Skill
        Set<String> allExamPartIds = questions.stream().map(Question::getExamPartId).collect(Collectors.toSet());
        List<ExamPart> examParts = examPartRepository.findAllById(allExamPartIds);
        Map<String, String> examPartToSkillIdMap = examParts.stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getSkillId));

        Map<String, Integer> skillCorrectCount = new HashMap<>();

        for (UserAnswer ua : uniqueAnswers) {
            String questionId = ua.getQuestionId();
            Question question = questionMap.get(questionId);
            List<Answer> correctAnswers = correctAnswersMap.get(questionId);

            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) {
                continue;
            }

            // 4. Logic kiểm tra đúng/sai (MCQ/MSQ/FILL) qua helper dùng chung
            boolean isCorrect = AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    ua.getSelectedAnswerId(), ua.getSelectedAnswerIds(),
                    ua.getAnswerText(), correctAnswers);

            String examPartId = question.getExamPartId();
            String skillId = examPartId != null ? examPartToSkillIdMap.get(examPartId) : null;

            if (isCorrect && skillId != null) {
                skillCorrectCount.merge(skillId, 1, Integer::sum);
            }
        }

        // 5. Quy đổi điểm
        int totalScore = 0;
        for (Map.Entry<String, Integer> entry : skillCorrectCount.entrySet()) {
            String skillId = entry.getKey();
            Integer numCorrect = entry.getValue();

            int convertedScore = scoringConversionRepository
                    .findByExamTypeIdAndSkillIdAndNumCorrect(examType.getExamTypeId(), skillId, numCorrect)
                    .map(ScoringConversion::getConvertedScore)
                    .orElse(5);

            totalScore += convertedScore;
        }

        Set<String> allSkillIdsInTest = examParts.stream().map(ExamPart::getSkillId).filter(Objects::nonNull).collect(Collectors.toSet());
        for (String skillId : allSkillIdsInTest) {
            if (!skillCorrectCount.containsKey(skillId)) {
                int convertedScore = scoringConversionRepository
                        .findByExamTypeIdAndSkillIdAndNumCorrect(examType.getExamTypeId(), skillId, 0)
                        .map(ScoringConversion::getConvertedScore)
                        .orElse(5);
                totalScore += convertedScore;
            }
        }
        return totalScore;
    }

    private List<UserAnswer> deduplicateByQuestionId(List<UserAnswer> userAnswers) {
        if (userAnswers == null || userAnswers.isEmpty()) {
            return List.of();
        }
        Map<String, UserAnswer> uniqueByQuestionId = new LinkedHashMap<>();
        for (UserAnswer userAnswer : userAnswers) {
            if (userAnswer.getQuestionId() == null) {
                continue;
            }
            uniqueByQuestionId.putIfAbsent(userAnswer.getQuestionId(), userAnswer);
        }
        return new ArrayList<>(uniqueByQuestionId.values());
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

        // 🔒 Tạo NEW attempt: phải pass mọi guard.
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

            // 💰 Bài trả phí: phải đã mua quyền (người tạo được miễn). Resume ở trên không qua đây.
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

        // 🛡 Bắt buộc test phải thuộc ExamCategory cho phép guest.
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

        String scoringMethod = examType.getScoringMethod() != null
                ? examType.getScoringMethod().toLowerCase() : "default";
        int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());

        int totalScore;
        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            totalScore = scoreToeicOptimal(userAnswers, test, examType);
        } else if ("aws_scale".equalsIgnoreCase(scoringMethod)) {
            totalScore = scoreAwsScale(userAnswers, totalQuestionsInTest);
        } else {
            totalScore = scoreDefault(userAnswers, totalQuestionsInTest);
        }

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
        // 🔒 Đề của lớp -> chỉ thành viên lớp xem; đề public theo exam_type -> mọi user đăng nhập xem được.
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

        // 🏅 Hạng của chính người đang xem — tính trên TOÀN bảng (kể cả khi nằm ngoài top hiển thị).
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
        // 🔒 Chỉ user sở hữu attempt, chủ đề (giáo viên), hoặc admin được xem.
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