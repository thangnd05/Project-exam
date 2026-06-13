package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamTypeResponse {
    private String examTypeId;
    private String name;
    private String description;
    private Integer durationMinutes;
    private String scoringMethod;
}
