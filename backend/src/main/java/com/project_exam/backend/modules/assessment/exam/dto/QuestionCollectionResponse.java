package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollectionResponse {
    private String collectionId;
    private String name;
    private String description;

    private Long questionCount;

    private String parentId;

    private String parentName;

    private Long childCount;

    private Long totalQuestionCount;

    private String examTypeId;

    private Integer displayOrder;
}
