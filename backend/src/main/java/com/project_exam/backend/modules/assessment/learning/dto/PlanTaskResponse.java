package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class PlanTaskResponse {

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

    private RecommendedResourceResponse studyResource;

    private Integer wrongCountAtDiagnosis;
}
