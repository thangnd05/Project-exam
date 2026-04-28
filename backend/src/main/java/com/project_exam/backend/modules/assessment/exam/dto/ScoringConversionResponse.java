package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ScoringConversionResponse {
    private String conversionId;
    private String examTypeId;
    private String skillId;
    private Integer numCorrect;
    private Integer convertedScore;
}
