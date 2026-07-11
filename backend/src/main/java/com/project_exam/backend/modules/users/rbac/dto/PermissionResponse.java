package com.project_exam.backend.modules.users.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    private String permissionId;
    private String code;
    private String description;
    private String groupName;
}
