package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

import java.util.List;

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
    private List<String> selectedAnswerIds;
    private String answerText;
}
