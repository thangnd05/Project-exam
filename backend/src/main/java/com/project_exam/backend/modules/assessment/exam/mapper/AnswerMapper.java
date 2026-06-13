package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import org.springframework.stereotype.Component;

@Component
public class AnswerMapper {

    /** View cho người làm bài: KHÔNG lộ đáp án đúng. */
    public AnswerResponse toResponse(Answer answer) {
        return AnswerResponse.builder()
                .answerId(answer.getAnswerId())
                .answerText(answer.getAnswerText())
                .answerLabel(answer.getAnswerLabel())
                .build();
    }

    /** View admin/đáp án: có cờ isCorrect. */
    public AnswerAdminResponse toAdminResponse(Answer answer) {
        return AnswerAdminResponse.builder()
                .answerId(answer.getAnswerId())
                .answerText(answer.getAnswerText())
                .answerLabel(answer.getAnswerLabel())
                .isCorrect(answer.getIsCorrect())
                .build();
    }
}
