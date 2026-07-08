package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamTypeLayout;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamTypeLayoutMapper {

    public ExamTypeLayoutResponse toResponse(ExamTypeLayout l) {
        return ExamTypeLayoutResponse.builder()
                .examTypeId(l.getExamTypeId())
                .config(l.getConfig())
                .updatedAt(l.getUpdatedAt())
                .build();
    }
}
