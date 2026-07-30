package com.project_exam.backend.modules.assessment.target.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneResponse {
    private String examTargetMilestoneId;
    private String examTypeId;
    private Integer milestoneScore;
    private String description;
    private Instant createdAt;
    private List<PartRequirementResponse> partRequirements;
}
