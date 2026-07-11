package com.project_exam.backend.modules.classroom.member.mapper;

import com.project_exam.backend.modules.classroom.member.domain.ClassMember;
import com.project_exam.backend.modules.classroom.member.dto.ClassMemberResponse;
import com.project_exam.backend.modules.users.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class ClassMemberMapper {

    public ClassMemberResponse toResponse(ClassMember m, User user) {
        return ClassMemberResponse.builder()
                .id(m.getId())
                .classId(m.getClassId())
                .userId(m.getUserId())
                .fullName(resolveDisplayName(user))
                .status(m.getStatus())
                .joinedAt(m.getJoinedAt())
                .build();
    }

    private String resolveDisplayName(User user) {
        if (user != null) {
            if (user.getFullName() != null && !user.getFullName().isBlank()) {
                return user.getFullName();
            }
            if (user.getUserName() != null && !user.getUserName().isBlank()) {
                return user.getUserName();
            }
        }
        return "Học sinh";
    }
}
