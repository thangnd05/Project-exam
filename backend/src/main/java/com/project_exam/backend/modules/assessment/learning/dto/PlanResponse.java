package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
public class PlanResponse {

    private String learningPlanId;
    private String userId;
    private String examTypeId;
    private String sourceUserTestId;

    private Integer planSequence;
    private String status;
    private String replacedByPlanId;

    private Boolean targetAchieved;

    private Integer targetScore;

    private Integer baselineReadiness;

    private String readinessLevel;

    private String diagnosisSourceCategory;

    private Boolean diagnosisSourcePractice;

    private String planStage;
    private String userTargetId;

    private Boolean targetOutdated;

    private Instant createdAt;

    private Integer totalTasks;
    private Integer passedTasks;
    private Integer estimatedDaysRemaining;

    private String recommendedTaskId;

    private List<PlanPartGroupDto> partGroups;

    private List<String> partsWithoutTasks;
}
