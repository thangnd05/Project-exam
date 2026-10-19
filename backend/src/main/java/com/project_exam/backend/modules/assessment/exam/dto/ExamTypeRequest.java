package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ExamTypeRequest {
    private String name;
    /** Bắt buộc khi tạo, vd "saa-c03". Khi sửa: null thì giữ nguyên. */
    private String slug;
    private String description;
    private String imageUrl;
    private Integer durationMinutes;
    private String scoringMethod;
    private Integer scoreMin;
    private Integer scoreMax;
    private Boolean flexible;

    private String parentId;
}
