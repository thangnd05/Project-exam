package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class PlanTaskDto {

    private String taskId;
    private Integer taskOrder;
    private String tagId;

    private String taskType;
    private Integer targetQuestionCount;
    private String tagName;
    private String examPartId;
    private String examPartName;
    private String status;
    private Integer passAccuracy;
    private BigDecimal baselineAccuracy;
    private BigDecimal bestAccuracy;
    private Integer attemptCount;

    private PlanPhaseDto.RecommendedResourceDto studyResource;

    private Integer priorityScore;
    private Integer wrongCountAtDiagnosis;
}
