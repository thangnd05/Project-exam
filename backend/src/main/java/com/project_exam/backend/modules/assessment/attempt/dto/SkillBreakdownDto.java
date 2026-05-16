package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SkillBreakdownDto {
    private String skillId;
    private String skillName;
    private int correct;
    private int wrong;
    private int total;
    private double percentage;
    private Integer convertedScore;
}
