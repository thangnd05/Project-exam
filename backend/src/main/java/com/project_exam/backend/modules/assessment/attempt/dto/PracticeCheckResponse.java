package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PracticeCheckResponse {
    private String vocabId;
    private boolean correct;
    private String status; // learning / mastered
    private int correctCount;
}
