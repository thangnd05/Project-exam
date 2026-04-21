package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.Question.QuestionType;
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
}
