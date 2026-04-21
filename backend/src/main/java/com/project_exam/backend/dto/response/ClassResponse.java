package com.project_exam.backend.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClassResponse {
    private String classId;
    private String className;
    private String description;
    private String teacherId;
    private LocalDateTime createdAt;
}
