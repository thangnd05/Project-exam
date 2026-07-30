package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question.QuestionType;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NormalQuestionRequest {
    private String questionText;
    private QuestionType questionType;
    private List<AnswerRequest> answers;

    private boolean needsManualCorrect;
    private String collectionId;
    private String explanation;
    private List<String> tagIds;

    private List<String> tagNames;

    private Integer questionNumber;
}
