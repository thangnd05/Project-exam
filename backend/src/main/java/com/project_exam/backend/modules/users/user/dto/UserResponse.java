package com.project_exam.backend.modules.users.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
    private Boolean verified;
    private Boolean isPremium;

    private String roleName;
    private List<String> permissions;
}
