package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

@Data
public class ExamTypeLayoutRequest {
    // JSON string cấu hình bố cục. null/"" = xoá cấu hình, quay về mặc định.
    private String config;
}
