package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class RecoveryResourceResponse {
    private final String resourceId;
    private final String title;
    private final String description;
    private final RecoveryResource.ResourceType resourceType;
    private final String url;
    private final String createdBy;
    private final Instant createdAt;
    private final List<TagResponse> tags;
}
