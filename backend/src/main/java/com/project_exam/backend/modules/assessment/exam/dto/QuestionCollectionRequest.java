package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class QuestionCollectionRequest {
    private String name;
    private String description;
    /**
     * Collection cha. null/rỗng = collection cấp 1 (cha). Có giá trị = collection con.
     * Cha được trỏ tới phải là collection cấp 1 (chỉ hỗ trợ 2 cấp).
     */
    private String parentId;
    /**
     * Loại kỳ thi cho collection cấp 1 (vd TOEIC). Chỉ áp dụng cho collection cha;
     * collection con tự kế thừa từ cha nên field này bị bỏ qua khi có parentId.
     */
    private String examTypeId;
    /**
     * Thứ tự hiển thị (số nhỏ lên trước). null = không đặt / không thay đổi (khi cập nhật);
     * khi không đặt, FE sắp theo tên numeric-aware.
     */
    private Integer displayOrder;
}
