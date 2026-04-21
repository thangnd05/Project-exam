package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class ClassMemberActionRequest {
    private String classId;
    private String userId;
}
