package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class AnswerAdminResponse {

    private final String answerId;
    private final String answerText;
    private final String answerLabel;
    private final Boolean isCorrect;
}

