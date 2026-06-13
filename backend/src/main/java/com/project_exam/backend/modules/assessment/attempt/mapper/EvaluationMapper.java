package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.users.domain.User;
import org.springframework.stereotype.Component;

/**
 * Mapper thuần Evaluation -> DTO (sub-module ASSESSMENT/ATTEMPT).
 * User được service load (lookup) rồi truyền vào.
 */
@Component
public class EvaluationMapper {

    public EvaluationResponse toResponse(Evaluation e, User user) {
        return EvaluationResponse.builder()
                .id(e.getId())
                .content(e.getContent())
                .rating(e.getRating())
                .createdAt(e.getCreatedAt())
                .userId(user.getUserId())
                .username(user.getUserName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
