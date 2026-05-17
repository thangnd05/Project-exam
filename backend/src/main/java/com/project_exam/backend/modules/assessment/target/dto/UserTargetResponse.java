package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserTargetResponse {
    private String userTargetId;
    private String userId;
    private String examTypeId;
    private Integer targetScore;
    private List<UserTargetPartResponse> partRequirements;
}
