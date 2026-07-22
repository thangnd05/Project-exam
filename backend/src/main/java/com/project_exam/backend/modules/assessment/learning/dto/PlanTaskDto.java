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
    /** Số session fail liên tiếp gần đây (reset khi pass). UI dùng để hiện cảnh báo stuck. */
    private Integer consecutiveFails;

    /** Tài liệu đọc trước khi luyện (RecoveryResource gắn tag). */
    private PlanPhaseDto.RecommendedResourceDto studyResource;

    private Integer priorityScore;
    private Integer wrongCountAtDiagnosis;
}
