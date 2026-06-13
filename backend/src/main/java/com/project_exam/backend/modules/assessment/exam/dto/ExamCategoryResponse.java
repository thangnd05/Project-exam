package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamCategoryResponse {
    private String examCategoryId;
    private String code;
    private String name;
    private String description;
    private Boolean guestAllowed;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
