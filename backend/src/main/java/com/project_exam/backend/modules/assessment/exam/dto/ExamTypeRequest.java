package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ExamTypeRequest {
    private String name;
    private String description;
    private String imageUrl;
    private Integer durationMinutes;
    private String scoringMethod;
    private Boolean flexible;
    /** examType cha (gom nhóm). null/rỗng = examType gốc/lá. Cha phải là examType gốc (tối đa 2 cấp). */
    private String parentId;
}
