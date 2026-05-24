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
    /** TAG | PART_CAPSTONE_1 | PART_CAPSTONE_2 */
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

    /** Tài liệu đọc trước khi luyện (RecoveryResource gắn tag). */
    private PlanPhaseDto.RecommendedResourceDto studyResource;

    private Integer priorityScore;
    /** HIGH | MEDIUM | LOW */
    private String priorityTier;
    private Integer wrongCountAtDiagnosis;
    /** Gợi ý UI: nên học trước (top priority trong plan). */
    private Boolean recommendedFirst;
}
