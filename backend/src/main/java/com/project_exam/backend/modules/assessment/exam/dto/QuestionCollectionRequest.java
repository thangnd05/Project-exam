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
}
