package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class QuestionCreateRequest {
    private String examPartId;
    private String classId;
    private String chapterId;
    private PassageRequest passage;
    private String questionText;
    private Question.QuestionType questionType;
    private List<AnswerRequest> answers;

    private Boolean isBank;
    private String collectionId;
    private String explanation;
    private List<String> tagIds;
}

