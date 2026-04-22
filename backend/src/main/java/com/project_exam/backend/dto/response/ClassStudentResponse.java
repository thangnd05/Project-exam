package com.project_exam.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClassStudentResponse {
    private String classId;
    private String classQr;
    private String className;
    private String teacherName;
}
