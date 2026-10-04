package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả tạo câu hỏi số lượng lớn. Chỉ trả id thay vì toàn bộ câu hỏi: import nghìn câu mà
 * trả về đủ nội dung, đáp án, lời giải thì response lên tới vài MB trong khi UI không dùng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionImportResult {

    private int createdCount;

    private List<String> questionIds;

    public static QuestionImportResult of(List<QuestionAdminResponse> created) {
        List<String> ids = created.stream().map(QuestionAdminResponse::getQuestionId).toList();
        return new QuestionImportResult(ids.size(), ids);
    }
}
