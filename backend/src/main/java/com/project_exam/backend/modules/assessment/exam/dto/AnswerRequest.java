package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnswerRequest {
    /** Có giá trị khi sửa: cập nhật đáp án đó; null = thêm mới. */
    private String answerId;
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel; // ví dụ: A, B, C, D
    private String questionId;

    public AnswerRequest(String answerId, String answerText, Boolean isCorrect, String answerLabel) {
        this.answerId = answerId;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.answerLabel = answerLabel;
    }
}
