package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamTypeMapper {

    public ExamTypeResponse toResponse(ExamType t) {
        return toResponse(t, null, 0L);
    }

    /** parentName và childCount cần truy vấn DB nên service tính sẵn rồi truyền vào. */
    public ExamTypeResponse toResponse(ExamType t, String parentName, Long childCount) {
        return ExamTypeResponse.builder()
                .examTypeId(t.getExamTypeId())
                .name(t.getName())
                .description(t.getDescription())
                .durationMinutes(t.getDurationMinutes())
                .scoringMethod(t.getScoringMethod())
                .flexible(Boolean.TRUE.equals(t.getFlexible()))
                .parentId(t.getParentId())
                .parentName(parentName)
                .childCount(childCount)
                .build();
    }
}
