package com.project_exam.backend.modules.users.mapper;

import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.dto.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getUserId())
                .userName(user.getUserName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleId(user.getRoleId())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
