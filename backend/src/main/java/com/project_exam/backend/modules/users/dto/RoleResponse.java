package com.project_exam.backend.modules.users.dto;

import lombok.Data;

@Data
public class RoleResponse {
    private String roleId;
    private String roleName;
    private String description;
}
