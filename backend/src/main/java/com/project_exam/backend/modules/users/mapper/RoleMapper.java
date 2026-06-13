package com.project_exam.backend.modules.users.mapper;

import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.dto.RoleResponse;
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
