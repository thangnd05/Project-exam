package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
public class TaskSessionHistoryDto {
    private String sessionId;
    private String status;
    private Integer questionCount;
    private Integer accuracy;
    private Boolean passed;
    private Instant startedAt;
    private Instant submittedAt;
}
