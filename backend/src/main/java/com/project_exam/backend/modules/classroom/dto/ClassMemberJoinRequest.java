package com.project_exam.backend.modules.classroom.dto;

import lombok.Data;

@Data
public class ClassMemberJoinRequest {
    private String classId;
    private String classQr;
}
