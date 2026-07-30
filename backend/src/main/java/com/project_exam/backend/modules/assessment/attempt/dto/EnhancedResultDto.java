package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class EnhancedResultDto {

    private long correct;
    private long wrong;
    private long total;
    private Long totalScore;

    private String examCategoryCode;
    private String examTypeId;

    private List<PartBreakdownDto> partBreakdown;

    private int percentage;
    private int gaugePercentage;
    private String displayValue;
    private String gaugeLabel;
    private String gaugeTitle;
    private String gaugeMessage;

    private int readinessScore;
    private String readinessLevel;

    private boolean passed;

    private Integer percentile;

    private boolean hasTarget;
    private Boolean isTargetMet;
    private Integer targetScore;

    private String recoveryMessage;
}
