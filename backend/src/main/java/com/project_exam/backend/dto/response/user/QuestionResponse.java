package com.project_exam.backend.dto.response.user;

import com.project_exam.backend.dto.response.PassageMediaResponse;
import com.project_exam.backend.dto.response.PassageResponse;
import com.project_exam.backend.models.Question;
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

}

