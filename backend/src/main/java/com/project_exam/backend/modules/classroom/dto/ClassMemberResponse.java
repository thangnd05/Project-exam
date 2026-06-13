package com.project_exam.backend.modules.classroom.dto;

import com.project_exam.backend.modules.classroom.domain.ClassMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassMemberResponse {
    private String id;
    private String classId;
    private String userId;
    private String fullName;
    private ClassMember.MemberStatus status;
    private LocalDateTime joinedAt;
}
