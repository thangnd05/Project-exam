package com.project_exam.backend.dto.response;

import com.project_exam.backend.models.ClassMember;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClassMemberResponse {
    private String id;
    private String classId;
    private String userId;
    private String fullName;
    private ClassMember.MemberStatus status;
    private LocalDateTime joinedAt;
}
