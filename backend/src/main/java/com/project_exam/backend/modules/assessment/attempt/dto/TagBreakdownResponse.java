package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class TagBreakdownResponse {
    private String tagId;
    private String tagName;
    private int correct;
    private int wrong;
    private int skipped;
    private int total;
    private double percentage;

    private List<TagQuestionRefResponse> questions;
}
