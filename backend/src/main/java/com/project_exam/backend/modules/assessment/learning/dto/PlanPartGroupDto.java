package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class PlanPartGroupDto {

    private String examPartId;
    private String examPartName;
    private Integer displayOrder;
    private Integer passAccuracy;
    private int passedTasksInPart;
    private int totalTasksInPart;

    private List<RecommendedResourceDto> partResources;
    private List<PlanTaskDto> tasks;
}
