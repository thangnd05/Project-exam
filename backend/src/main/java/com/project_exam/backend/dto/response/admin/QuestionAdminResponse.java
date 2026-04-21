package com.project_exam.backend.dto.response.admin;

import com.project_exam.backend.dto.response.PassageMediaResponse;
import com.project_exam.backend.dto.response.PassageResponse;
import com.project_exam.backend.models.Question;
import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class QuestionAdminResponse {

    private final String questionId;
    private final String examPartId;
    private final String questionText;
    private final Question.QuestionType questionType;
    private final String explanation;

    // Admin-specific fields
    private final String examTypeId;
    private final String classId;
    private final Boolean isBank;

    private final PassageResponse passage;
    private final List<PassageMediaResponse> passageMedia;

    private final List<AnswerAdminResponse> answers;
}