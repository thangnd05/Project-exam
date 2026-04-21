package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class ExamTypeRequest {
    private String name;
    private String description;
    private Integer durationMinutes;
    private String scoringMethod;
}
