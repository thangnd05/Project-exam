package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class QuestionAdminResponse {

    private final String questionId;
    private final Integer questionNumber;
    private final String examPartId;
    private final String questionText;
    private final Question.QuestionType questionType;
    private final String explanation;

    // Admin-specific fields
    private final String examTypeId;
    private final String classId;
    private final Boolean isBank;
    private final String collectionId;

    private final PassageResponse passage;
    private final List<PassageMediaResponse> passageMedia;

    private final List<AnswerAdminResponse> answers;

    private final List<TagResponse> tags;
}