package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class QuestionCollectionRequest {
    private String name;
    private String description;

    private String parentId;

    private String examTypeId;

    private Integer displayOrder;
}
