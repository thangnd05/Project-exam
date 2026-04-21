package com.project_exam.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswerRequest {
    private String userTestId;       // thêm luôn userTestId
    private String questionId;
    private String selectedAnswerId; // null nếu tự luận
    private String answerText;     // cho tự luận
}
