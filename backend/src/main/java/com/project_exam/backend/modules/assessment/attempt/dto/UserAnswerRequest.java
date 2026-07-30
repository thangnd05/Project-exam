package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswerRequest {
    private String userTestId;
    private String questionId;
    private String selectedAnswerId;
    private List<String> selectedAnswerIds;
    private String answerText;
}
