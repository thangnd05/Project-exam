package com.project_exam.backend.modules.assessment.target.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class MilestoneRequest {
    @NotNull
    private String examTypeId;

    @NotNull
    private Integer milestoneScore;

    private String description;

    private List<PartRequirementRequest> partRequirements;
}
