package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

@Data
public class PartRequirementResponse {
    private String targetPartRequirementId;
    private String examPartId;
    private Integer requiredPercentage;
}
