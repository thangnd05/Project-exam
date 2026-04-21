package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class TestPartRequest {
    private String testId;
    private String examPartId;
    private Integer numQuestions;
}