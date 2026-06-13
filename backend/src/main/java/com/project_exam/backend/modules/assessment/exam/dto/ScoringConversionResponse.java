package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringConversionResponse {
    private String conversionId;
    private String examTypeId;
    private String skillId;
    private Integer numCorrect;
    private Integer convertedScore;
}
