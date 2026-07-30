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
    private PlanTaskDto activeTask;
    private RecommendedResourceDto resource;
    private Integer passAccuracyRequired;

    private Integer correctCount;
    private Integer totalCount;
    private Integer accuracy;
    private Boolean passed;
    private List<QuestionResponse> questions;
    private Integer totalTasks;
    private Integer passedTasks;
    private String message;

    private String notice;
    private List<PlanPartGroupDto> partGroups;
    private List<PlanTaskDto> tasks;
    private List<SubmitSessionResponse.ReviewItem> lastReviewItems;
}
