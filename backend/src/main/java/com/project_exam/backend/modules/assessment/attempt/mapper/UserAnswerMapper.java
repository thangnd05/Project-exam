package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import org.springframework.stereotype.Component;

/** Mapper thuần UserAnswer -> DTO (sub-module ASSESSMENT/ATTEMPT). */
@Component
public class UserAnswerMapper {

    public UserAnswerResponse toResponse(UserAnswer userAnswer) {
        return UserAnswerResponse.builder()
                .userAnswerId(userAnswer.getUserAnswerId())
                .userTestId(userAnswer.getUserTestId())
                .questionId(userAnswer.getQuestionId())
                .selectedAnswerId(userAnswer.getSelectedAnswerId())
                .answerText(userAnswer.getAnswerText())
                .build();
    }
}
