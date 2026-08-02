package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TagQuestionRefResponse {
    private String questionId;
    private int questionNumber;

    private String status;
}
