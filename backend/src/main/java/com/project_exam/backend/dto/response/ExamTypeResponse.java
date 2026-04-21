package com.project_exam.backend.dto.response;

import lombok.Data;

@Data
public class ExamTypeResponse {
    private String examTypeId;
    private String name;
    private String description;
    private Integer durationMinutes;
    private String scoringMethod;
}
