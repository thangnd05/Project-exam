package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TagBreakdownDto {
    private String tagId;
    private String tagName;
    private int correct;
    private int wrong;
    private int total;
    private double percentage;
}
