package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamCategoryResponse {
    private String examCategoryId;
    private String code;
    private String name;
    private String description;
    private Boolean guestAllowed;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
