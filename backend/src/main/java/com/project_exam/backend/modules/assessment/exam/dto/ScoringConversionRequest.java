package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ScoringConversionRequest {
    private String examTypeId;
    private String skillId;
    private Integer numCorrect;
    private Integer convertedScore;
}
