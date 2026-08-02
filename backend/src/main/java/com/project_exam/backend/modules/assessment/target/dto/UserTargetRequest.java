package com.project_exam.backend.modules.assessment.target.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UserTargetRequest {
    @NotNull
    private String examTypeId;

    @NotNull
    private Integer targetScore;

    /** Optional. Bổ sung target_score: mục tiêu % readiness. */
    private Integer targetReadiness;

    private List<UserPartRequirementRequest> customParts;
}
