package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class PartBreakdownDto {
    private String examPartId;
    private String partName;
    private String skillId;
    private String skillName;
    private int correct;
    private int wrong;
    private int total;
    private double percentage;
    private Double targetPercentage; // Nullable if no target is set
    private Boolean isTargetMet; // Nullable if no target is set
    private List<TagBreakdownDto> weakTags;
}
