package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class QuestionCollectionResponse {
    private String collectionId;
    private String name;
    private String description;
}
