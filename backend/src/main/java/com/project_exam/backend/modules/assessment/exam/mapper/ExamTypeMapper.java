package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamTypeMapper {

    public ExamTypeResponse toResponse(ExamType t) {
        return ExamTypeResponse.builder()
                .examTypeId(t.getExamTypeId())
                .name(t.getName())
                .description(t.getDescription())
                .durationMinutes(t.getDurationMinutes())
                .scoringMethod(t.getScoringMethod())
                .flexible(Boolean.TRUE.equals(t.getFlexible()))
                .build();
    }
}
