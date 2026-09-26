package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RecoveryResourceMapper {

    public RecoveryResourceResponse toResponse(RecoveryResource resource, List<TagResponse> tags,
                                               String examTypeName, List<ExamPart> examParts) {
        return RecoveryResourceResponse.builder()
                .resourceId(resource.getResourceId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .url(resource.getUrl())
                .originalFileName(resource.getOriginalFileName())
                .createdBy(resource.getCreatedBy())
                .createdAt(resource.getCreatedAt())
                .tags(tags)
                .examTypeId(resource.getExamTypeId())
                .examTypeName(examTypeName)
                .examPartIds(examParts.stream().map(ExamPart::getExamPartId).toList())
                .examPartNames(examParts.stream().map(ExamPart::getName).toList())
                .build();
    }
}
