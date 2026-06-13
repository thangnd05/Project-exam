package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TagMapper {

    public TagResponse toResponse(Tag tag, List<TagResponse> children) {
        return TagResponse.builder()
                .tagId(tag.getTagId())
                .name(tag.getName())
                .examTypeId(tag.getExamTypeId())
                .parentId(tag.getParentId())
                .children(children)
                .build();
    }
}
