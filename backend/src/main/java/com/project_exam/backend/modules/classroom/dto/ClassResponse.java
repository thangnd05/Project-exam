package com.project_exam.backend.modules.classroom.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClassResponse {
    private String classId;
    private String classQr;
    private String className;
    private String description;
    private String teacherId;
    private LocalDateTime createdAt;
}
