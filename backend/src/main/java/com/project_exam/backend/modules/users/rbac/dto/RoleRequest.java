package com.project_exam.backend.modules.users.rbac.dto;

import lombok.Data;

@Data
public class RoleRequest {
    private String roleName;
    private String description;
}
