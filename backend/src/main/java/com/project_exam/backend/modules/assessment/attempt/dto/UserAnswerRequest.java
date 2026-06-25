package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswerRequest {
    private String userTestId;       // thêm luôn userTestId
    private String questionId;
    private String selectedAnswerId; // MCQ: 1 đáp án; null nếu tự luận/MSQ
    private List<String> selectedAnswerIds; // MSQ: nhiều đáp án
    private String answerText;     // cho tự luận
}
