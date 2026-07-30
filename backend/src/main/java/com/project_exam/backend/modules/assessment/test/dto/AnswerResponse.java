package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AnswerResponse {
    private String answerId;
    private String answerText;
    private String answerLabel;
}
