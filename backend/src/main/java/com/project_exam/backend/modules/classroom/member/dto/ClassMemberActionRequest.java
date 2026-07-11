package com.project_exam.backend.modules.classroom.member.dto;

import lombok.Data;

@Data
public class ClassMemberActionRequest {
    private String classId;
    private String userId;
}
