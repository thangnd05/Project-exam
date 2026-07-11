package com.project_exam.backend.modules.users.rbac.repository;

import com.project_exam.backend.modules.users.rbac.domain.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, String> {
    Optional<Permission> findByCode(String code);
}
