package com.project_exam.backend.modules.assessment.target.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
