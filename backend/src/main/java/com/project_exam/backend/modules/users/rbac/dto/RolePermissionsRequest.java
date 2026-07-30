package com.project_exam.backend.modules.users.rbac.dto;

import lombok.Data;

import java.util.List;

@Data
public class RolePermissionsRequest {
    private List<String> codes;
}
