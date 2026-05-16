package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RecoveryRecommendationDto {
    private String skillName;
    private String tagName;
    private String resourceId;
    private String resourceTitle;
    private String resourceUrl;
    private String resourceDescription;
}
