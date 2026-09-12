package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RecommendedResourceResponse {

    private String resourceId;
    private String title;
    private String description;
    private String url;
    private String originalFileName;
}
