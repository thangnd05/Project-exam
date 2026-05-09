package com.project_exam.backend.modules.assessment.test.dto;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private String questionId;
    private String examPartId;
    private String questionText;
    private Question.QuestionType questionType;
    private Boolean isBank;
    private PassageResponse passage;
    private List<PassageMediaResponse> passageMedia;
    private String testPartId;
    private List<AnswerResponse> answers;
    private String collectionId;

}

