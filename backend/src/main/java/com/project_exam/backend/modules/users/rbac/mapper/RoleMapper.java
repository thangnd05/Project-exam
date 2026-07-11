package com.project_exam.backend.modules.users.rbac.mapper;

import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.rbac.dto.RoleResponse;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {

    public RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .roleId(role.getRoleId())
                .roleName(role.getRoleName())
                .description(role.getDescription())
                .build();
    }
}
