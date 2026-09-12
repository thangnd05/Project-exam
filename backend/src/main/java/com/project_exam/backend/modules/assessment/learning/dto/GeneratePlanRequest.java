package com.project_exam.backend.modules.assessment.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneratePlanRequest {

    @NotBlank(message = "userTestId không được để trống")
    private String userTestId;

    @Min(value = 3, message = "Cần tối thiểu 3 ngày")
    @Max(value = 365, message = "Tối đa 365 ngày")
    private Integer deadlineDays;

    private Integer targetScore;

    private java.util.List<String> focusExamPartIds;
}
