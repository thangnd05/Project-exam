package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.exception.NotFoundException;

import com.project_exam.backend.dto.response.ResultSummaryDto;
import com.project_exam.backend.dto.request.UserAnswerRequest;
import com.project_exam.backend.dto.response.UserAnswerResponse;
import com.project_exam.backend.models.Answer;
import com.project_exam.backend.models.Question;
import com.project_exam.backend.models.Test;
import com.project_exam.backend.models.TestStatus;
import com.project_exam.backend.models.TestQuestion;
import com.project_exam.backend.models.UserAnswer;
import com.project_exam.backend.models.UserTest;
import jakarta.transaction.Transactional;
import com.project_exam.backend.repositories.*;
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

    private UserAnswerResponse toResponse(UserAnswer userAnswer) {
        return UserAnswerResponse.builder()
                .userAnswerId(userAnswer.getUserAnswerId())
                .userTestId(userAnswer.getUserTestId())
                .questionId(userAnswer.getQuestionId())
                .selectedAnswerId(userAnswer.getSelectedAnswerId())
                .answerText(userAnswer.getAnswerText())
                .build();
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

    public List<UserAnswerResponse> findAllResponses() {
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<UserAnswer> findById(String id) {
        return userAnswerRepository.findById(id);
    }

    public Optional<UserAnswerResponse> findResponseById(String id) {
        return findById(id).map(this::toResponse);
    }

    public List<UserAnswer> findByUserTestId(String userTestId) {
        return userAnswerRepository.findByUserTestId(userTestId);
    }

    public List<UserAnswerResponse> findResponsesByUserTestId(String userTestId) {
        return findByUserTestId(userTestId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserAnswer> findByQuestionId(String questionId) {
        return userAnswerRepository.findByQuestionId(questionId);
    }

    public List<UserAnswerResponse> findResponsesByQuestionId(String questionId) {
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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập bài thi này");
        }

        if (userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài thi đã nộp, không thể sửa đáp án");
        }
    }

    public boolean delete(String id) {
        return userAnswerRepository.findById(id).map(u -> {
            userAnswerRepository.delete(u);
            return true;
        }).orElse(false);
    }

    // ✅ PHƯƠNG THỨC LOGIC MỚI ĐƯỢC CHUYỂN VÀO ĐÂY
    public ResultSummaryDto getResultSummary(String userTestId, String currentUserId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem kết quả bài thi này");
        }

        // ✅ Kiểm tra quyền xem kết quả dựa trên thời gian
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
