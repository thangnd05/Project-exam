package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class QuestionMapper {

    public QuestionResponse toUserResponse(
            Question question,
            PassageResponse passage,
            List<PassageMediaResponse> passageMedia,
            List<AnswerResponse> answers
    ) {
        return QuestionResponse.builder()
                .questionId(question.getQuestionId())
                .questionNumber(question.getQuestionNumber())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .isBank(question.getIsBank())
                .collectionId(question.getCollectionId())
                .passage(passage)
                .passageMedia(passageMedia)
                .answers(answers)
                .build();
    }

    public QuestionAdminResponse toAdminResponseSummary(Question question, List<TagResponse> tags) {
        return QuestionAdminResponse.builder()
                .questionId(question.getQuestionId())
                .questionNumber(question.getQuestionNumber())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .classId(question.getClassId())
                .isBank(question.getIsBank())
                .collectionId(question.getCollectionId())
                .examTypeId(null)
                .passage(null)
                .passageMedia(List.of())
                .answers(List.of())
                .tags(tags)
                .build();
    }

    public QuestionAdminResponse toAdminResponseFull(
            Question question,
            String examTypeId,
            PassageResponse passage,
            List<PassageMediaResponse> passageMedia,
            List<AnswerAdminResponse> answers,
            List<TagResponse> tags
    ) {
        return QuestionAdminResponse.builder()
                .questionId(question.getQuestionId())
                .questionNumber(question.getQuestionNumber())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .examTypeId(examTypeId)
                .classId(question.getClassId())
                .isBank(question.getIsBank())
                .collectionId(question.getCollectionId())
                .passage(passage)
                .passageMedia(passageMedia)
                .answers(answers)
                .tags(tags)
                .build();
    }
}
