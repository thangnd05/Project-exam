package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

@Data
public class PartRequirementDto {
    private String examPartId;
    private Integer requiredPercentage;
}
