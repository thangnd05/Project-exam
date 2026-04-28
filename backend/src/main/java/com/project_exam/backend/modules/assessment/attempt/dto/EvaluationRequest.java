package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Data;

@Data
public class EvaluationRequest {
    private String content;
    private Integer rating;
}
