package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

/**
 * Tạo câu hỏi "tức thì" và gắn thẳng vào một part của đề (không lưu kho, isBank = false).
 * Dùng khi giáo viên trên lớp đặt câu hỏi rồi đưa vào đề.
 */
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CreateQuestionAndAttachRequest {
    private String testPartId;
    private String classId;
    private String chapterId;
    private PassageRequest passage;
    private String questionText;
    private Question.QuestionType questionType;
    private List<AnswerRequest> answers;
    private String collectionId;
}
