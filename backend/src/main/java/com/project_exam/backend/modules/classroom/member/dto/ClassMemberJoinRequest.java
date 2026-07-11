package com.project_exam.backend.modules.classroom.member.dto;

import lombok.Data;

@Data
public class ClassMemberJoinRequest {
    private String classId;
    private String classQr;
}
