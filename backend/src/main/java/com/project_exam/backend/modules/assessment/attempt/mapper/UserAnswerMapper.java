package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import org.springframework.stereotype.Component;

import java.util.List;

/** Mapper thuần UserAnswer -> DTO (sub-module ASSESSMENT/ATTEMPT). */
@Component
public class UserAnswerMapper {

    public UserAnswerResponse toResponse(UserAnswer userAnswer) {
        return UserAnswerResponse.builder()
                .userAnswerId(userAnswer.getUserAnswerId())
                .userTestId(userAnswer.getUserTestId())
                .questionId(userAnswer.getQuestionId())
                .selectedAnswerId(userAnswer.getSelectedAnswerId())
                .selectedAnswerIds(List.copyOf(AnswerGradingUtil.parseIds(userAnswer.getSelectedAnswerIds())))
                .answerText(userAnswer.getAnswerText())
                .build();
    }
}
