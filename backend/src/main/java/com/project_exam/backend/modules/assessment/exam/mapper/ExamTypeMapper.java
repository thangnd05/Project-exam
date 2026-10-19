package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamTypeMapper {

    public ExamTypeResponse toResponse(ExamType t) {
        return toResponse(t, null, 0L);
    }

    public ExamTypeResponse toResponse(ExamType t, ExamType parent, Long childCount) {
        return ExamTypeResponse.builder()
                .examTypeId(t.getExamTypeId())
                .name(t.getName())
                .slug(t.getSlug())
                .description(t.getDescription())
                .imageUrl(t.getImageUrl())
                .durationMinutes(t.getDurationMinutes())
                .scoringMethod(t.getScoringMethod())
                .scoreMin(t.getScoreMin())
                .scoreMax(t.getScoreMax())
                .flexible(Boolean.TRUE.equals(t.getFlexible()))
                .parentId(t.getParentId())
                .parentName(parent != null ? parent.getName() : null)
                .parentSlug(parent != null ? parent.getSlug() : null)
                .childCount(childCount)
                .build();
    }
}
