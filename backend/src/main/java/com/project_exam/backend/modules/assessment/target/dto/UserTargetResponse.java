package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserTargetResponse {
    private String userTargetId;
    private String userId;
    private String examTypeId;
    private Integer targetScore;
    private String examTargetMilestoneId;
    private Integer milestoneScore;
    private String milestoneDescription;
    private boolean milestoneMatched; // true nếu target trùng với milestone admin
    private List<UserTargetPartResponse> partRequirements;
}
