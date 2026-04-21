package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
    Role findByRoleName(String roleName);

    Optional<Role> findByRoleId(String roleId);

}