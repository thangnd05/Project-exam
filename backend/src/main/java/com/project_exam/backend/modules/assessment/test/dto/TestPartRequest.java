package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;

@Data
public class TestPartRequest {
    private String testId;
    private String examPartId;
    private Integer numQuestions;
}
