package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class PlanPhaseDto {

    private String phaseId;
    private Integer phaseOrder;

    private String examPartId;
    private String examPartName;

    private Integer daysAllocated;
    private Integer practiceSize;

    private BigDecimal currentPercentage;

    private BigDecimal weaknessScore;

    private List<WeakTagDto> weakTags;

    private List<RecommendedResourceDto> recommendedResources;

    private List<String> recommendedQuestionIds;

    private Integer completedPractices;

    @Getter
    @Setter
    @Builder
    public static class WeakTagDto {
        private String tagId;
        private String tagName;
        private double percentage;
    }

    @Getter
    @Setter
    @Builder
    public static class RecommendedResourceDto {
        private String resourceId;
        private String title;
        private String description;
        private String url;
        private String originalFileName;
    }
}
