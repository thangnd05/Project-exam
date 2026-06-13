package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

import java.util.List;

@Getter 
@Setter 
@Builder 
@NoArgsConstructor
@AllArgsConstructor
public class PracticeQuestionResponse {
    private String vocabId;
    private String type; // MULTICHOICE hoặc LISTENING_EN
    private String questionText;
    private String voiceUrl;
    private String word;
    private String meaning;
    private List<String> options; // 4 đáp án nghĩa
}
