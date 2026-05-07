package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.modules.classroom.domain.ClassMember.MemberStatus;

import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
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
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;


import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserTestService {

    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final AnswerRepository answerRepository;
    private final TestRepository testRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ScoringConversionRepository scoringConversionRepository;
    private final QuestionRepository questionRepository;
    private final ExamPartRepository examPartRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final UserRepository userRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final AuthUtils authUtils;

    public UserTestResponse toResponse(UserTest userTest) {
        return UserTestResponse.builder()
                .userTestId(userTest.getUserTestId())
                .userId(userTest.getUserId())
                .testId(userTest.getTestId())
                .startedAt(userTest.getStartedAt())
                .finishedAt(userTest.getFinishedAt())
                .totalScore(userTest.getTotalScore())
                .status(userTest.getStatus() != null ? userTest.getStatus().name() : null)
                .durationTaken(
                        userTest.getFinishedAt() != null && userTest.getStartedAt() != null
                                ? Duration.between(userTest.getStartedAt(), userTest.getFinishedAt()).getSeconds()
                                : null
                )
                .build();
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

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            userTest.setTotalScore(0);
            return userTestRepository.save(userTest);
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));

        ExamType examType = examTypeRepository.findById(test.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType not found"));

        String scoringMethod = examType.getScoringMethod() != null ? examType.getScoringMethod().toLowerCase() : "default";
        int totalQuestionsInTest = calculateTotalQuestionsInTest(userTest.getTestId());

        int totalScore;
        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            totalScore = scoreToeicOptimal(userAnswers, test, examType);
        } else {
            totalScore = scoreDefault(userAnswers, totalQuestionsInTest);
        }

        userTest.setTotalScore(totalScore);
        return userTestRepository.save(userTest);
    }

    private int scoreDefault(List<UserAnswer> userAnswers, int totalQuestionsInTest) {
        if (userAnswers.isEmpty()) {
            return 0;
        }

        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        int totalQuestions = totalQuestionsInTest > 0 ? totalQuestionsInTest : questionIds.size();
        if (totalQuestions == 0) {
            return 0;
        }

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, Answer> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, answer -> answer));

        int correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            String qId = userAnswer.getQuestionId();
            Question question = questionMap.get(qId);
            Answer correctAnswer = correctAnswersMap.get(qId);

            if (question == null || correctAnswer == null) {
                continue;
            }

            boolean isCorrect = false;
            if (question.getQuestionType() == Question.QuestionType.MCQ) {
                isCorrect = userAnswer.getSelectedAnswerId() != null &&
                        userAnswer.getSelectedAnswerId().equals(correctAnswer.getAnswerId());
            } else if (question.getQuestionType() == Question.QuestionType.FILL_BLANK) {
                isCorrect = userAnswer.getAnswerText() != null &&
                        userAnswer.getAnswerText().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
            } else if (question.getQuestionType() == Question.QuestionType.ESSAY) {
                // ESSAY cần chấm tay, không tự động
                continue;
            }

            if (isCorrect) {
                correctCount++;
            }
        }

        // Tính điểm theo thang 100: (số câu đúng / tổng số câu) * 100
        return (int) Math.round((double) correctCount / totalQuestions * 100);
    }

    private int scoreToeicOptimal(List<UserAnswer> userAnswers, Test test, ExamType examType) {
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        // 1. Lấy thông tin Question đầy đủ
        List<String> allQuestionIds = uniqueAnswers.stream().map(UserAnswer::getQuestionId).toList();
        List<Question> questions = questionRepository.findAllById(allQuestionIds);
        Map<String, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        // 2. Lấy thông tin đáp án đúng đầy đủ
        Map<String, Answer> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(allQuestionIds)
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, answer -> answer));

        // 3. Lấy thông tin ExamPart và Skill
        Set<String> allExamPartIds = questions.stream().map(Question::getExamPartId).collect(Collectors.toSet());
        List<ExamPart> examParts = examPartRepository.findAllById(allExamPartIds);
        Map<String, String> examPartToSkillIdMap = examParts.stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getSkillId));

        Map<String, Integer> skillCorrectCount = new HashMap<>();

        for (UserAnswer ua : uniqueAnswers) {
            String questionId = ua.getQuestionId();
            Question question = questionMap.get(questionId);
            Answer correctAnswer = correctAnswersMap.get(questionId);

            if (question == null || correctAnswer == null) {
                continue;
            }

            // 4. Logic kiểm tra đúng/sai đã được nâng cấp
            boolean isCorrect = false;
            if (question.getQuestionType() == Question.QuestionType.MCQ) {
                isCorrect = ua.getSelectedAnswerId() != null && ua.getSelectedAnswerId().equals(correctAnswer.getAnswerId());
            } else if (question.getQuestionType() == Question.QuestionType.FILL_BLANK) {
                isCorrect = ua.getAnswerText() != null && ua.getAnswerText().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
            }

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
        if (!authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Chỉ admin được xem toàn bộ user-tests.");
        }
        return findAll().stream().map(this::toResponse).toList();
    }
    public Optional<UserTest> findById(String id) { return userTestRepository.findById(id); }
    public List<UserTest> findByUserId(String userId) { return userTestRepository.findByUserId(userId); }
    public List<UserTestResponse> findResponsesByUserId(String userId) {
        return findByUserId(userId).stream().map(this::toResponse).toList();
    }
    public List<UserTest> findByTestId(String testId) { return userTestRepository.findByTestId(testId); }

    /** Chỉ chủ đề (hoặc admin) được xem toàn bộ attempts của một bài test. */
    public List<UserTestResponse> findResponsesByTestId(String testId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        requireTestOwnerOrAdmin(testId, httpRequest);
        return findByTestId(testId).stream().map(this::toResponse).toList();
    }
    public UserTest save(UserTest userTest) { return userTestRepository.save(userTest); }
    public UserTestResponse saveResponse(UserTest userTest) { return toResponse(save(userTest)); }

    private void requireTestOwnerOrAdmin(String testId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (authUtils.isAdmin(httpRequest)) return;
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
            if (!isOwner && !authUtils.isAdmin(httpRequest)) {
                throw new ForbiddenException("Bạn không có quyền xoá bài làm này.");
            }
            userTestRepository.delete(u);
            return true;
        }).orElse(false);
    }

    @Transactional
    public UserTest startUserTest(String testId, String userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found with id: " + testId));

        // ✅ RESUME: nếu user đã có attempt đang làm dở, trả về luôn — không áp dụng
        // các guard time-window/max-attempts nữa, vì user đã start hợp lệ trước đó.
        // (Class membership cũng skip cho resume — user vào lớp rồi rời ra vẫn được hoàn thành.)
        Optional<UserTest> existing = userTestRepository.findActiveUserTest(userId, testId, UserTest.Status.IN_PROGRESS);
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
        Integer maxAttempts = test.getMaxAttempts();
        if (maxAttempts != null && maxAttempts > 0) {
            int completedAttempts = userTestRepository.countByUserIdAndTestIdAndStatus(userId, testId, UserTest.Status.COMPLETED);
            if (completedAttempts >= maxAttempts) {
                throw new ForbiddenException("Bạn đã hết số lượt làm bài.");
            }
        }

        // ✅ Tạo mới user_test
        UserTest newTest = new UserTest();
        newTest.setUserId(userId);
        newTest.setTestId(testId);
        newTest.setStartedAt(LocalDateTime.now());
        newTest.setStatus(UserTest.Status.IN_PROGRESS);
        newTest.setTotalScore(0);

        return userTestRepository.save(newTest);
    }

    public Optional<UserTest> findActiveUserTest(String userId, String testId) {
        return userTestRepository.findActiveUserTest(userId, testId, UserTest.Status.IN_PROGRESS);
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
                .map(u -> UserTestResponse.builder()
                        .userTestId(u.getUserTestId())
                        .userId(u.getUserId())
                        .userName(userNameById.get(u.getUserId()))
                        .testId(u.getTestId())
                        .startedAt(u.getStartedAt())
                        .finishedAt(u.getFinishedAt())
                        .totalScore(u.getTotalScore())
                        .status(u.getStatus().name())
                        .durationTaken(
                                u.getFinishedAt() != null
                                        ? Duration.between(u.getStartedAt(), u.getFinishedAt()).getSeconds()
                                        : null
                        )
                        .build()
                )
                .collect(Collectors.toList());
    }

    public List<UserTestResponse> getAttemptsByTest(String testId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        // 🔒 Chỉ chủ đề (hoặc admin) được xem toàn bộ attempts của 1 bài test.
        requireTestOwnerOrAdmin(testId, httpRequest);
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
    
        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;
    
        //  chỉ chặn khi có giới hạn thời gian nhưng chưa hết
        if (!isUnlimited && !isEnded) {
            return Collections.emptyList();
        }

        List<UserTest> list = userTestRepository.findByTestIdAndStatus(testId, UserTest.Status.COMPLETED);
        Map<String, UserTest> bestAttemptByUser = new HashMap<>();
        for (UserTest attempt : list) {
            String userId = attempt.getUserId();
            UserTest currentBest = bestAttemptByUser.get(userId);

            if (currentBest == null || isBetterAttempt(attempt, currentBest)) {
                bestAttemptByUser.put(userId, attempt);
            }
        }
        Map<String, String> userNameById = loadUserNames(bestAttemptByUser.values());

        return bestAttemptByUser.values().stream()
                .map(u -> UserTestResponse.builder()
                        .userTestId(u.getUserTestId())
                        .userId(u.getUserId())
                        .userName(userNameById.get(u.getUserId()))
                        .testId(u.getTestId())
                        .startedAt(u.getStartedAt())
                        .finishedAt(u.getFinishedAt())
                        .totalScore(u.getTotalScore())
                        .status(u.getStatus().name())
                        .durationTaken(
                                u.getFinishedAt() != null
                                        ? Duration.between(u.getStartedAt(), u.getFinishedAt()).getSeconds()
                                        : null
                        )
                        .build()
                )
                .sorted(
                        Comparator
                                .comparing(UserTestResponse::getTotalScore, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserTestResponse::getDurationTaken, Comparator.nullsLast(Comparator.naturalOrder()))
                )
                .collect(Collectors.toList());
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
        if (!authUtils.isAdmin(httpRequest)) {
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
        return UserTestResponse.builder()
                .userTestId(ut.getUserTestId())
                .testId(ut.getTestId())
                .userId(ut.getUserId())
                .userName(resolveUserName(ut.getUserId()))
                .startedAt(ut.getStartedAt())
                .finishedAt(ut.getFinishedAt())
                .totalScore(ut.getTotalScore())
                .status(ut.getStatus().name())
                .durationTaken(ut.getFinishedAt() != null ? Duration.between(ut.getStartedAt(), ut.getFinishedAt()).getSeconds() : null)
                .build();
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