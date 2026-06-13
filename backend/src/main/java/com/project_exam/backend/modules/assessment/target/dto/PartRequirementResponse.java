package com.project_exam.backend.modules.assessment.target.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartRequirementResponse {
    private String targetPartRequirementId;
    private String examPartId;
    private Integer requiredPercentage;
}
