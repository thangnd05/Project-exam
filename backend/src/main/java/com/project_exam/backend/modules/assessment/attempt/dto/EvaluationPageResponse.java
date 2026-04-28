package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Data;

import java.util.List;

@Data
public class EvaluationPageResponse {
    private List<EvaluationResponse> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
