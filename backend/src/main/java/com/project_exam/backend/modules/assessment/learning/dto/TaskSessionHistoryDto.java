package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Một lần luyện ải (1 row trong learning_plan_sessions). */
@Getter
@Setter
@Builder
public class TaskSessionHistoryDto {
    private String sessionId;
    private String planStage;
    private String status;
    private Integer questionCount;
    private Integer accuracy;
    private Boolean passed;
    private Instant startedAt;
    private Instant submittedAt;
}
