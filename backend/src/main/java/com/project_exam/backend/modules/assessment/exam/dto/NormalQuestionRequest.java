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
    /**
     * true khi parser không xác định được đáp án đúng, UI preview nên yêu cầu người dùng chọn tay.
     */
    private boolean needsManualCorrect;
    private String collectionId;
    private String explanation;
    private List<String> tagIds; // optional: danh sách tag gắn cho câu hỏi (theo id)
    /**
     * optional: tên tag đọc được từ dòng "Tags:" trong file import. Lúc lưu, BE sẽ
     * resolve tên -> tagId theo examType của part (chỉ khớp tag có sẵn, bỏ qua tên lạ).
     */
    private List<String> tagNames;
    /** Thứ tự tương đối từ form (1, 2, 3…); BE cộng vào max hiện có trong kho. */
    private Integer questionNumber;
}
