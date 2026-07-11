package com.project_exam.backend.modules.users.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private String roleId;
    private String roleName;
    private String description;
    // Danh sách permission code đã gán cho role (cho ma trận phân quyền trên UI).
    private List<String> permissions;
}
