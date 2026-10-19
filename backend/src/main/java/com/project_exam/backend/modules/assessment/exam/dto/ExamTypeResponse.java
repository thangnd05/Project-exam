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
    private String slug;
    private String description;
    private String imageUrl;
    private Integer durationMinutes;
    private String scoringMethod;
    private Integer scoreMin;
    private Integer scoreMax;
    private Boolean flexible;

    private String parentId;

    private String parentName;

    private String parentSlug;

    private Long childCount;
}
