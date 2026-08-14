package com.project_exam.backend.modules.assessment.learning.dto;

import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class CurrentSessionResponse {

    private String mode;

    private String learningPlanId;

    private String examTypeId;
    private String planStage;
    private String sessionId;
    private PlanTaskResponse activeTask;
    private RecommendedResourceResponse resource;
    private Integer passAccuracyRequired;

    private Integer correctCount;
    private Integer totalCount;
    private Integer accuracy;
    private Boolean passed;
    private List<QuestionResponse> questions;
    private Integer totalTasks;
    private Integer passedTasks;

    /** Mã trạng thái bất thường (EMPTY_POOL_SKIPPED / EMPTY_POOL_RETRY)  FE tự map ra câu chữ. */
    private String noticeCode;
    private List<PlanPartGroupResponse> partGroups;
    private List<SubmitSessionResponse.ReviewItem> lastReviewItems;
}
