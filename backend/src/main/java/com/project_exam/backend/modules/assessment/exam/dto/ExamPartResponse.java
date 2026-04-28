package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ExamPartResponse {
    private String examPartId;
    private String examTypeId;
    private String name;
    private String description;
    private Integer defaultNumQuestions;
    private String skillId;
}
