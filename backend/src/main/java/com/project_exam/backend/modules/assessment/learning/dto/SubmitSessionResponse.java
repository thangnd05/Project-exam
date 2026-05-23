package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SubmitSessionResponse {

    private String sessionId;
    private int correctCount;
    private int totalCount;
    private int accuracy;
    private boolean passed;
    private String taskStatus;
    private String planStage;
    private boolean unlockedNextTask;
    private String message;
}
