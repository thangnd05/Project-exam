package com.project_exam.backend.modules.classroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClassStudentResponse {
    private String classId;
    private String classQr;
    private String className;
    private String teacherName;
}
