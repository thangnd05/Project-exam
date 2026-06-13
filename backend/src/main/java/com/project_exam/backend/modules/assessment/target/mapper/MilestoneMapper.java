package com.project_exam.backend.modules.assessment.target.mapper;

import com.project_exam.backend.modules.assessment.target.domain.ExamTargetMilestone;
import com.project_exam.backend.modules.assessment.target.domain.TargetPartRequirement;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneResponse;
import com.project_exam.backend.modules.assessment.target.dto.PartRequirementResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper thuần cho milestone (sub-module ASSESSMENT/TARGET).
 * partRequirements (cần load DB) do service truyền vào.
 */
@Component
public class MilestoneMapper {

    public MilestoneResponse toResponse(ExamTargetMilestone m, List<PartRequirementResponse> partRequirements) {
        return MilestoneResponse.builder()
                .examTargetMilestoneId(m.getExamTargetMilestoneId())
                .examTypeId(m.getExamTypeId())
                .milestoneScore(m.getMilestoneScore())
                .description(m.getDescription())
                .createdAt(m.getCreatedAt())
                .partRequirements(partRequirements)
                .build();
    }

    public PartRequirementResponse toPartRequirementResponse(TargetPartRequirement p) {
        return PartRequirementResponse.builder()
                .targetPartRequirementId(p.getTargetPartRequirementId())
                .examPartId(p.getExamPartId())
                .requiredPercentage(p.getRequiredPercentage())
                .build();
    }
}
