package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class ScoringConversionRequest {
    private String examTypeId;
    private String skillId;
    private Integer numCorrect;
    private Integer convertedScore;
}
