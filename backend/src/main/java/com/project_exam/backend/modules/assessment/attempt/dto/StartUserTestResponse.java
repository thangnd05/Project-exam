package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartUserTestResponse {
    private String message;
    private String userTestId;
    private String status;
    private String startedAt;
    private String mode;
    private String serverNow;
}
