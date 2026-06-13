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

/**
 * Mapper thuần cho Question → các response DTO.
 *
 * <p>Question response được dựng với TẬP FIELD KHÁC NHAU tuỳ ngữ cảnh, nên mỗi shape
 * có một method riêng. Mọi giá trị cần DB/tính toán (examTypeId, passage dto,
 * passageMedia dtos, answer dtos, tags) được service tính sẵn và truyền vào.</p>
 */
@Component
public class QuestionMapper {

    /**
     * Shape "user" (view người làm bài) — {@link QuestionResponse}.
     * Dùng ở {@code toUserQuestionResponse}. KHÔNG set explanation/examTypeId/classId/tags/testPartId
     * (giữ null/không set như site gốc).
     */
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

    /**
     * Shape "admin summary" (kho, dạng list) — {@link QuestionAdminResponse}.
     * Dùng ở {@code findAllAdminSummaries}. examTypeId=null, passage=null,
     * passageMedia=List.of(), answers=List.of() là cố định cho shape này; chỉ tags truyền vào.
     */
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

    /**
     * Shape "admin full" (chi tiết, có passage/media/answers) — {@link QuestionAdminResponse}.
     * Dùng ở {@code buildQuestionAdminResponse} và {@code getQuestionDetailAdmin}.
     */
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
