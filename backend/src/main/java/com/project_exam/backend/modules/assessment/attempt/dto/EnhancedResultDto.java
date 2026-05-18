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

    // Gauge display (pre-computed by BE)
    private int percentage;          // % đúng (0-100)
    private int gaugePercentage;     // % cho vòng tròn
    private String displayValue;     // "67%" hoặc "10/450"
    private String gaugeLabel;       // "Độ chính xác" / "Mục tiêu" / "Readiness"
    private String gaugeTitle;       // "Xuất sắc", "Chưa đạt mục tiêu"...
    private String gaugeMessage;     // Mô tả chi tiết

    // Readiness
    private int readinessScore;
    private String readinessLevel;

    // Pass/fail
    private boolean passed;

    // Percentile
    private Integer percentile;

    // Target tracking
    private boolean hasTarget;
    private Boolean isTargetMet;
    private Integer targetScore;

    // Recovery
    private String recoveryMessage;
    private List<RecoveryRecommendationDto> recommendations;
}
