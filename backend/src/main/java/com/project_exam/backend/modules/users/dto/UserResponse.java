package com.project_exam.backend.modules.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String userName;
    private String fullName;
    private String email;
    private String roleId;
    private String avatarUrl;
}
