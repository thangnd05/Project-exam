package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;

import com.project_exam.backend.modules.assessment.attempt.dto.ResultSummaryDto;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import com.project_exam.backend.modules.assessment.attempt.mapper.UserAnswerMapper;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestStatus;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import jakarta.transaction.Transactional;
import com.project_exam.backend.modules.users.repository.*;
import com.project_exam.backend.modules.posts.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserAnswerService {
    private final UserAnswerRepository userAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final AuthUtils authUtils;
    private final UserAnswerMapper userAnswerMapper;

    private UserAnswerResponse toResponse(UserAnswer userAnswer) {
        return userAnswerMapper.toResponse(userAnswer);
    }

    private UserAnswer toEntity(UserAnswerRequest request) {
        UserAnswer userAnswer = new UserAnswer();
        userAnswer.setUserTestId(request.getUserTestId());
        userAnswer.setQuestionId(request.getQuestionId());
        userAnswer.setSelectedAnswerId(request.getSelectedAnswerId());
        userAnswer.setAnswerText(request.getAnswerText());
        return userAnswer;
    }

    public List<UserAnswer> findAll() {
        return userAnswerRepository.findAll();
    }

    /** Chỉ admin được liệt kê toàn bộ đáp án. */
    public List<UserAnswerResponse> findAllResponses(jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Chỉ admin được xem toàn bộ đáp án.");
        }
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<UserAnswer> findById(String id) {
        return userAnswerRepository.findById(id);
    }

    /** Chỉ owner attempt, chủ đề (giáo viên), hoặc admin được xem 1 đáp án. */
    public Optional<UserAnswerResponse> findResponseById(String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return findById(id).map(ua -> {
            if (!authUtils.isAdmin(httpRequest)) {
                UserTest ut = userTestRepository.findById(ua.getUserTestId())
                        .orElseThrow(() -> new NotFoundException("UserTest not found"));
                String currentUserId = authUtils.getUserId(httpRequest);
                boolean isAttemptOwner = currentUserId != null && currentUserId.equals(ut.getUserId());
                boolean isTestOwner = false;
                if (!isAttemptOwner && currentUserId != null) {
                    Test test = testRepository.findById(ut.getTestId()).orElse(null);
                    isTestOwner = test != null && currentUserId.equals(test.getCreatedBy());
                }
                if (!isAttemptOwner && !isTestOwner) {
                    throw new ForbiddenException("Bạn không có quyền xem đáp án này.");
                }
            }
            return toResponse(ua);
        });
    }

    public List<UserAnswer> findByUserTestId(String userTestId) {
        return userAnswerRepository.findByUserTestId(userTestId);
    }

    public List<UserAnswerResponse> findResponsesByUserTestId(String userTestId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        // 🔒 Chỉ owner attempt, chủ đề (giáo viên), hoặc admin được xem.
        if (!authUtils.isAdmin(httpRequest)) {
            UserTest ut = userTestRepository.findById(userTestId)
                    .orElseThrow(() -> new NotFoundException("UserTest not found"));
            String currentUserId = authUtils.getUserId(httpRequest);
            boolean isAttemptOwner = currentUserId != null && currentUserId.equals(ut.getUserId());
            boolean isTestOwner = false;
            if (!isAttemptOwner && currentUserId != null) {
                Test test = testRepository.findById(ut.getTestId()).orElse(null);
                isTestOwner = test != null && currentUserId.equals(test.getCreatedBy());
            }
            if (!isAttemptOwner && !isTestOwner) {
                throw new ForbiddenException("Bạn không có quyền xem đáp án của bài làm này.");
            }
        }
        return findByUserTestId(userTestId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserAnswer> findByQuestionId(String questionId) {
        return userAnswerRepository.findByQuestionId(questionId);
    }

    /** Liệt kê toàn bộ đáp án theo câu hỏi (cross-attempt) — chỉ admin. */
    public List<UserAnswerResponse> findResponsesByQuestionId(String questionId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Chỉ admin được liệt kê đáp án theo câu hỏi.");
        }
        return findByQuestionId(questionId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UserAnswer save(UserAnswer userAnswer) {
        return userAnswerRepository.save(userAnswer);
    }

    public UserAnswerResponse create(UserAnswerRequest request, String currentUserId) {
        return toResponse(upsertByUserTestAndQuestion(request, currentUserId));
    }

    public UserAnswerResponse update(String id, UserAnswerRequest request, String currentUserId) {
        validateUserAnswerRequest(request);
        validateOwnershipAndInProgress(request.getUserTestId(), currentUserId);
        UserAnswer userAnswer = toEntity(request);
        userAnswer.setUserAnswerId(id);
        return toResponse(save(userAnswer));
    }

    @Transactional
    public List<UserAnswerResponse> upsertBatch(List<UserAnswerRequest> requests, String currentUserId) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        return requests.stream()
                .map(request -> upsertByUserTestAndQuestion(request, currentUserId))
                .map(this::toResponse)
                .toList();
    }

    private UserAnswer upsertByUserTestAndQuestion(UserAnswerRequest request, String currentUserId) {
        validateUserAnswerRequest(request);
        validateOwnershipAndInProgress(request.getUserTestId(), currentUserId);

        UserAnswer userAnswer = userAnswerRepository
                .findByUserTestIdAndQuestionId(request.getUserTestId(), request.getQuestionId())
                .orElseGet(UserAnswer::new);

        userAnswer.setUserTestId(request.getUserTestId());
        userAnswer.setQuestionId(request.getQuestionId());
        userAnswer.setSelectedAnswerId(request.getSelectedAnswerId());
        userAnswer.setAnswerText(request.getAnswerText());

        return userAnswerRepository.save(userAnswer);
    }

    private void validateUserAnswerRequest(UserAnswerRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request không được để trống");
        }
        if (request.getUserTestId() == null || request.getUserTestId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu userTestId");
        }
        if (request.getQuestionId() == null || request.getQuestionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu questionId");
        }
    }

    private void validateOwnershipAndInProgress(String userTestId, String currentUserId) {
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));

        if (!currentUserId.equals(userTest.getUserId())) {
            throw new ForbiddenException("Bạn không có quyền truy cập bài thi này");
        }

        if (userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã nộp, không thể sửa đáp án");
        }
    }

    // ===== GUEST FLOW =====

    @Transactional
    public List<UserAnswerResponse> upsertBatchForGuest(List<UserAnswerRequest> requests, String guestSessionId) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        return requests.stream()
                .map(request -> upsertGuestByUserTestAndQuestion(request, guestSessionId))
                .map(this::toResponse)
                .toList();
    }

    private UserAnswer upsertGuestByUserTestAndQuestion(UserAnswerRequest request, String guestSessionId) {
        validateUserAnswerRequest(request);
        validateGuestOwnershipAndInProgress(request.getUserTestId(), guestSessionId);

        UserAnswer userAnswer = userAnswerRepository
                .findByUserTestIdAndQuestionId(request.getUserTestId(), request.getQuestionId())
                .orElseGet(UserAnswer::new);

        userAnswer.setUserTestId(request.getUserTestId());
        userAnswer.setQuestionId(request.getQuestionId());
        userAnswer.setSelectedAnswerId(request.getSelectedAnswerId());
        userAnswer.setAnswerText(request.getAnswerText());

        return userAnswerRepository.save(userAnswer);
    }

    private void validateGuestOwnershipAndInProgress(String userTestId, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu guest session id");
        }
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        if (userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã nộp, không thể sửa đáp án");
        }
    }

    public ResultSummaryDto getGuestResultSummary(String userTestId, String guestSessionId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }

        // Guest result luôn xem được sau khi nộp — nhưng trước khi nộp trả 0.
        if (userTest.getStatus() != UserTest.Status.COMPLETED) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, Answer> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, answer -> answer));

        long correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            String qId = userAnswer.getQuestionId();
            Question question = questionMap.get(qId);
            Answer correctAnswer = correctAnswersMap.get(qId);
            if (question == null || correctAnswer == null) continue;

            boolean isCorrect = false;
            if (question.getQuestionType() == Question.QuestionType.MCQ) {
                isCorrect = userAnswer.getSelectedAnswerId() != null
                        && userAnswer.getSelectedAnswerId().equals(correctAnswer.getAnswerId());
            } else if (question.getQuestionType() == Question.QuestionType.FILL_BLANK) {
                isCorrect = userAnswer.getAnswerText() != null
                        && userAnswer.getAnswerText().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
            }
            if (isCorrect) correctCount++;
        }

        long totalQuestions = getTotalQuestionsInTest(userTest.getTestId());
        long normalizedCorrectCount = Math.min(correctCount, totalQuestions);
        long wrongCount = Math.max(totalQuestions - normalizedCorrectCount, 0);
        return new ResultSummaryDto(normalizedCorrectCount, wrongCount, totalQuestions, userTest.getTotalScore());
    }

    public List<UserAnswerResponse> findResponsesByUserTestIdForGuest(String userTestId, String guestSessionId) {
        UserTest ut = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (ut.getGuestSessionId() == null || !ut.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return findByUserTestId(userTestId).stream()
                .map(this::toResponse)
                .toList();
    }

    public boolean delete(String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return userAnswerRepository.findById(id).map(u -> {
            // 🔒 Chỉ owner attempt hoặc admin được xoá đáp án.
            if (!authUtils.isAdmin(httpRequest)) {
                String currentUserId = authUtils.getUserId(httpRequest);
                UserTest ut = userTestRepository.findById(u.getUserTestId())
                        .orElseThrow(() -> new NotFoundException("UserTest not found"));
                if (currentUserId == null || !currentUserId.equals(ut.getUserId())) {
                    throw new ForbiddenException("Bạn không có quyền xoá đáp án này.");
                }
            }
            userAnswerRepository.delete(u);
            return true;
        }).orElse(false);
    }

    //  PHƯƠNG THỨC LOGIC MỚI ĐƯỢC CHUYỂN VÀO ĐÂY
    public ResultSummaryDto getResultSummary(String userTestId, String currentUserId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền xem kết quả bài thi này");
        }

        //  Kiểm tra quyền xem kết quả dựa trên thời gian
        Test test = testRepository.findById(userTest.getTestId())
            .orElseThrow(() -> new NotFoundException("Test not found"));

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        if (!isUnlimited && !isEnded) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, Answer> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, answer -> answer));

        long correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            String qId = userAnswer.getQuestionId();
            Question question = questionMap.get(qId);
            Answer correctAnswer = correctAnswersMap.get(qId);

            if (question == null || correctAnswer == null) continue;

            boolean isCorrect = false;
            if (question.getQuestionType() == Question.QuestionType.MCQ) {
                isCorrect = userAnswer.getSelectedAnswerId() != null &&
                        userAnswer.getSelectedAnswerId().equals(correctAnswer.getAnswerId());
            } else if (question.getQuestionType() == Question.QuestionType.FILL_BLANK) {
                isCorrect = userAnswer.getAnswerText() != null &&
                        userAnswer.getAnswerText().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
            }

            if (isCorrect) {
                correctCount++;
            }
        }

        long totalQuestions = getTotalQuestionsInTest(userTest.getTestId());
        long normalizedCorrectCount = Math.min(correctCount, totalQuestions);
        long wrongCount = Math.max(totalQuestions - normalizedCorrectCount, 0);
        return new ResultSummaryDto(normalizedCorrectCount, wrongCount, totalQuestions, userTest.getTotalScore());
    }

    private long getTotalQuestionsInTest(String testId) {
        List<String> testPartIds = testPartRepository.findByTestId(testId).stream()
                .map(testPart -> testPart.getTestPartId())
                .toList();
        if (testPartIds.isEmpty()) {
            return 0;
        }
        return testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
                .distinct()
                .count();
    }

    private List<UserAnswer> deduplicateByQuestionId(List<UserAnswer> userAnswers) {
        Map<String, UserAnswer> uniqueByQuestionId = new LinkedHashMap<>();
        for (UserAnswer userAnswer : userAnswers) {
            if (userAnswer.getQuestionId() == null) {
                continue;
            }
            uniqueByQuestionId.putIfAbsent(userAnswer.getQuestionId(), userAnswer);
        }
        return new ArrayList<>(uniqueByQuestionId.values());
    }

}
