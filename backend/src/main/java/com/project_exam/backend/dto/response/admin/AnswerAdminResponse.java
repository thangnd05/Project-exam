package com.project_exam.backend.dto.response.admin;

import com.project_exam.backend.dto.response.user.AnswerResponse;
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

