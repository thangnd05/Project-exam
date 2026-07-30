package com.project_exam.backend.modules.classroom.clazz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse {
    private String classId;
    private String classQr;
    private String className;
    private String description;
    private String teacherId;
    private Instant createdAt;
}
