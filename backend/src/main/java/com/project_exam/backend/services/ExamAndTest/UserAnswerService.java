package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.dto.response.ResultSummaryDto;
import com.project_exam.backend.models.Answer;
import com.project_exam.backend.models.Question;
import com.project_exam.backend.models.Test;
import com.project_exam.backend.models.TestStatus;
import com.project_exam.backend.models.UserAnswer;
import com.project_exam.backend.models.UserTest;
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

    public List<UserAnswer> findAll() {
        return userAnswerRepository.findAll();
    }

    public Optional<UserAnswer> findById(String id) {
        return userAnswerRepository.findById(id);
    }

    public List<UserAnswer> findByUserTestId(String userTestId) {
        return userAnswerRepository.findByUserTestId(userTestId);
    }

    public List<UserAnswer> findByQuestionId(String questionId) {
        return userAnswerRepository.findByQuestionId(questionId);
    }

    public UserAnswer save(UserAnswer userAnswer) {
        return userAnswerRepository.save(userAnswer);
    }

    public boolean delete(String id) {
        return userAnswerRepository.findById(id).map(u -> {
            userAnswerRepository.delete(u);
            return true;
        }).orElse(false);
    }

    // ✅ PHƯƠNG THỨC LOGIC MỚI ĐƯỢC CHUYỂN VÀO ĐÂY
    public ResultSummaryDto getResultSummary(String userTestId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UserTest not found"));

        // ✅ Kiểm tra quyền xem kết quả dựa trên thời gian
        Test test = testRepository.findById(userTest.getTestId())
            .orElseThrow(() -> new RuntimeException("Test not found"));

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        if (!isUnlimited && !isEnded) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        Set<String> questionIds = userAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, Answer> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, answer -> answer));

        long correctCount = 0;
        for (UserAnswer userAnswer : userAnswers) {
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

        long totalQuestions = userAnswers.size();
        long wrongCount = totalQuestions - correctCount;
        return new ResultSummaryDto(correctCount, wrongCount, totalQuestions, userTest.getTotalScore());
    }

}
