package com.project_exam.backend.modules.users.rbac.repository;

import com.project_exam.backend.modules.users.rbac.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
    Role findByRoleName(String roleName);

    Optional<Role> findByRoleId(String roleId);

}