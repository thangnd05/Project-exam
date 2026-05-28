package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;

import java.util.List;

@Data
public class TestPageResponse {
    private List<TestResponse> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
