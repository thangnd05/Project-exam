package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import org.springframework.stereotype.Component;

@Component
public class TagMapper {

    public TagResponse toResponse(Tag tag) {
        return toResponse(tag, null);
    }

    public TagResponse toResponse(Tag tag, String examPartName) {
        return TagResponse.builder()
                .tagId(tag.getTagId())
                .name(tag.getName())
                .examTypeId(tag.getExamTypeId())
                .examPartId(tag.getExamPartId())
                .examPartName(examPartName)
                .sortOrder(tag.getSortOrder())
                .build();
    }
}
