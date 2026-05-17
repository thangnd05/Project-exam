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

    private String examTargetMilestoneId; // optional — null nếu user nhập score tự do

    private List<UserPartRequirementDto> customParts;
}
