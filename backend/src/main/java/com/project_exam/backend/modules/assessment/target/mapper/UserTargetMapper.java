package com.project_exam.backend.modules.assessment.target.mapper;

import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import com.project_exam.backend.modules.assessment.target.domain.UserTargetPart;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetPartResponse;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper thuần cho sub-module ASSESSMENT/TARGET.
 * partRequirements (cần load DB) do service truyền vào.
 */
@Component
public class UserTargetMapper {

    /** Shape rỗng: chưa đặt mục tiêu (hasTarget=false, partRequirements=[]). */
    public UserTargetResponse toEmptyResponse() {
        return UserTargetResponse.builder()
                .hasTarget(false)
                .partRequirements(List.of())
                .build();
    }

    /** Shape đầy đủ: có mục tiêu. */
    public UserTargetResponse toResponse(UserTarget ut, List<UserTargetPartResponse> partRequirements) {
        return UserTargetResponse.builder()
                .hasTarget(true)
                .userTargetId(ut.getUserTargetId())
                .userId(ut.getUserId())
                .examTypeId(ut.getExamTypeId())
                .targetScore(ut.getTargetScore())
                .targetReadiness(ut.getTargetReadiness())
                .achievedAt(ut.getAchievedAt())
                .partRequirements(partRequirements)
                .build();
    }

    public UserTargetPartResponse toPartResponse(UserTargetPart p) {
        return UserTargetPartResponse.builder()
                .examPartId(p.getExamPartId())
                .requiredPercentage(p.getCustomPercentage())
                .currentScore(p.getCurrentScore())
                .lastUserTestId(p.getLastUserTestId())
                .build();
    }
}
