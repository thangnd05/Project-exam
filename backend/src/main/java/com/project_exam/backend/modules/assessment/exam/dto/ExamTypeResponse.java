package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamTypeResponse {
    private String examTypeId;
    private String name;
    private String description;
    private String imageUrl;
    private Integer durationMinutes;
    private String scoringMethod;
    private Boolean flexible;

    /** examType cha (null = gốc/lá). */
    private String parentId;
    /** Tên examType cha (tiện FE hiển thị). */
    private String parentName;
    /** Số examType con trực tiếp. >0 nghĩa là node cha (chỉ gom, không chọn được khi tạo đề). */
    private Long childCount;
}
