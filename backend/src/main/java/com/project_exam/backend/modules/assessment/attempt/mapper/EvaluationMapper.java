package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.users.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class EvaluationMapper {

    public EvaluationResponse toResponse(Evaluation e, User user, Test test) {
        return EvaluationResponse.builder()
                .id(e.getId())
                .content(e.getContent())
                .rating(e.getRating())
                .createdAt(e.getCreatedAt())
                .userId(e.getUserId())
                .username(user != null ? user.getUserName() : null)
                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                .testId(e.getTestId())
                .testTitle(test != null ? test.getTitle() : null)
                .build();
    }
}
