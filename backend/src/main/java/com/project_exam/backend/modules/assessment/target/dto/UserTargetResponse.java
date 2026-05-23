package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserTargetResponse {
    private boolean hasTarget;
    private String userTargetId;
    private String userId;
    private String examTypeId;
    private Integer targetScore;
    private Integer targetReadiness;
    private LocalDateTime achievedAt;
    private List<UserTargetPartResponse> partRequirements;
}
