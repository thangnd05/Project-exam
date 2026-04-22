package com.project_exam.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassSimpleResponse {
    private String classId;
    private String classQr;
    private String className;
}
