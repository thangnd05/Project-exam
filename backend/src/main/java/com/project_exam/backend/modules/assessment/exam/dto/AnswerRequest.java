package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnswerRequest {

    private String answerId;
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel;
    private String questionId;

    public AnswerRequest(String answerId, String answerText, Boolean isCorrect, String answerLabel) {
        this.answerId = answerId;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.answerLabel = answerLabel;
    }
}
