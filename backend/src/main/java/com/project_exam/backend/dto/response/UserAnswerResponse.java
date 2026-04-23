package com.project_exam.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswerResponse {
    private String userAnswerId;
    private String userTestId;
    private String questionId;
    private String selectedAnswerId;
    private String answerText;
}
