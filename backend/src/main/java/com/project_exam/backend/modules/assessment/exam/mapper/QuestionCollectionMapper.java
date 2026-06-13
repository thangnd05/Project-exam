package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import org.springframework.stereotype.Component;

@Component
public class QuestionCollectionMapper {

    /**
     * Mapper thuần: {@code questionCount} cần truy vấn DB nên service tính sẵn và truyền vào.
     */
    public QuestionCollectionResponse toResponse(QuestionCollection collection, Long questionCount) {
        return QuestionCollectionResponse.builder()
                .collectionId(collection.getCollectionId())
                .name(collection.getName())
                .description(collection.getDescription())
                .questionCount(questionCount)
                .build();
    }
}
