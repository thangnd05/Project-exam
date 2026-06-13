package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamCategoryMapper {

    public ExamCategoryResponse toResponse(ExamCategory c) {
        return ExamCategoryResponse.builder()
                .examCategoryId(c.getExamCategoryId())
                .code(c.getCode())
                .name(c.getName())
                .description(c.getDescription())
                .guestAllowed(c.getGuestAllowed())
                .displayOrder(c.getDisplayOrder())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
