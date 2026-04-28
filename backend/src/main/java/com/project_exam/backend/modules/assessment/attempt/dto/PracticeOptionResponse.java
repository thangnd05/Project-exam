package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeOptionResponse {
    private String id;
    private String optionText;
    private boolean isCorrect;

    public PracticeOptionResponse(String id, String optionText) {
        this.id = id;
        this.optionText = optionText;
    }
}

