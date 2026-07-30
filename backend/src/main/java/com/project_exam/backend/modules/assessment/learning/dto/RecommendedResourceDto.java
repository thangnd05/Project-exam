package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/** Tài liệu phương pháp gợi ý đọc trước khi luyện (lấy từ RecoveryResource theo tag hoặc theo Part). */
@Getter
@Setter
@Builder
public class RecommendedResourceDto {

    private String resourceId;
    private String title;
    private String description;
    private String url;
    private String originalFileName;
}
