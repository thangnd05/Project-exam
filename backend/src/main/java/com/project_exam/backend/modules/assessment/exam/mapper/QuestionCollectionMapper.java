package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import org.springframework.stereotype.Component;

@Component
public class QuestionCollectionMapper {

    public QuestionCollectionResponse toResponse(
            QuestionCollection collection,
            Long questionCount,
            String parentName,
            Long childCount,
            Long totalQuestionCount) {
        return QuestionCollectionResponse.builder()
                .collectionId(collection.getCollectionId())
                .name(collection.getName())
                .description(collection.getDescription())
                .questionCount(questionCount)
                .parentId(collection.getParentId())
                .parentName(parentName)
                .childCount(childCount)
                .totalQuestionCount(totalQuestionCount)
                .examTypeId(collection.getExamTypeId())
                .displayOrder(collection.getDisplayOrder())
                .build();
    }
}
