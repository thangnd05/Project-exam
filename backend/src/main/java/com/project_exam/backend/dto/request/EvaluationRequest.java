package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class EvaluationRequest {
    private String content;
    private Integer rating;
}
