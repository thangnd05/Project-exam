package com.project_exam.backend.modules.classroom.member.dto;

import com.project_exam.backend.modules.classroom.clazz.dto.ClassStudentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyClassesResponse {
    private List<ClassStudentResponse> teachingClasses;
    private List<ClassStudentResponse> learningClasses;
}
