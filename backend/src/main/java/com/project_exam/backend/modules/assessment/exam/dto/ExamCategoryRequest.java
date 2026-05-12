package com.project_exam.backend.modules.assessment.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExamCategoryRequest {

    @NotBlank(message = "code không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "name không được để trống")
    @Size(max = 100)
    private String name;

    private String description;

    private Boolean guestAllowed;

    private Integer displayOrder;
}
