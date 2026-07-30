package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PracticeCheckRequest {
    private String vocabId;
    private String type;
    private String selectedOptionText;
    private String userEnglish;
    private String userVietnamese;
}
