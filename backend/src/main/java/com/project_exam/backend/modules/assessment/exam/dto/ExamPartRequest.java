package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ExamPartRequest {
    private String examTypeId;
    private String name;
    private String description;
    private Integer defaultNumQuestions;
    private String skillId;
    private Integer displayOrder;
}
