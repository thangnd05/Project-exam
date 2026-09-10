package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * Sửa hàng loạt các thuộc tính "chung" của câu hỏi (không đụng nội dung câu,
 * đáp án hay passage — những thứ đó phải sửa từng câu).
 *
 * Quy ước ba trạng thái cho mỗi trường:
 *   - field == null            -> không đổi
 *   - clearCollection == true  -> gỡ câu ra khỏi bộ sưu tập (set null)
 *   - còn lại                  -> gán giá trị mới
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateQuestionsRequest {

    @NotEmpty(message = "Chưa chọn câu hỏi nào.")
    private List<String> questionIds;

    /** null = giữ nguyên. */
    private Question.UsageScope usageScope;

    /** null = giữ nguyên. Bỏ qua nếu clearCollection = true. */
    private String collectionId;

    /** true = gỡ khỏi bộ sưu tập; collectionId khi đó bị bỏ qua. */
    private Boolean clearCollection;

    /** null = giữ nguyên. */
    private Boolean isBank;
}
