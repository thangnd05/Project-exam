package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class EnhancedResultDto {
    // Tầng 1: tổng quan
    private long correct;
    private long wrong;
    private long total;
    private Long totalScore;

    // Metadata
    private String examCategoryCode;
    private String examTypeId;

    // Tầng 2: breakdown theo Skill
    private List<SkillBreakdownDto> skillBreakdown;

    // Tầng 2.5 + 3: breakdown theo Part + weakTags
    private List<PartBreakdownDto> partBreakdown;

    // Readiness
    private int readinessScore;
    private String readinessLevel;

    // Pass/fail
    private boolean passed;

    // Percentile
    private Integer percentile;

    // Target tracking
    private boolean hasTarget;
    private Integer targetScore;

    // Recovery recommendations
    private List<RecoveryRecommendationDto> recommendations;
}
