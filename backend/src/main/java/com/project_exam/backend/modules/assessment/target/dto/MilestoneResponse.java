package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

import java.util.List;

@Data
public class MilestoneResponse {
    private String examTargetMilestoneId;
    private String examTypeId;
    private Integer milestoneScore;
    private String description;
    private List<PartRequirementResponse> partRequirements;
}
