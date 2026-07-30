package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class TagResponse {
    private final String tagId;
    private final String name;
    private final String examTypeId;
    private final String parentId;
    private final Integer sortOrder;
    private final List<TagResponse> children;
}
