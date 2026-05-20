package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class RecoveryRecommendationDto {
    private String skillName;
    private List<String> tagNames;
    private String resourceId;
    private String resourceTitle;
    private String resourceUrl;
    private String originalFileName;
    private String resourceDescription;
}
