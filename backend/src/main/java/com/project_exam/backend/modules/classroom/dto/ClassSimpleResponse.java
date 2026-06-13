package com.project_exam.backend.modules.classroom.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSimpleResponse {
    private String classId;
    private String classQr;
    private String className;
}
