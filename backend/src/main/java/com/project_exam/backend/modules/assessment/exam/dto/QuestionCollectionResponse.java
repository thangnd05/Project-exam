package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollectionResponse {
    private String collectionId;
    private String name;
    private String description;
    /** Số câu hỏi gắn TRỰC TIẾP vào collection này (không tính collection con). */
    private Long questionCount;

    /** Collection cha (null = đây là collection cấp 1). */
    private String parentId;
    /** Tên collection cha (tiện cho FE hiển thị, null nếu là cấp 1). */
    private String parentName;
    /** Số collection con trực tiếp. */
    private Long childCount;
    /**
     * Tổng số câu hỏi gộp cả con-cháu (= questionCount của chính nó + của tất cả collection con).
     * Với collection con thì bằng questionCount.
     */
    private Long totalQuestionCount;

    /** Loại kỳ thi gắn với collection (cha set trực tiếp, con kế thừa từ cha). */
    private String examTypeId;
}
