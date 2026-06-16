package com.project_exam.backend.modules.users.repository;

import com.project_exam.backend.modules.users.domain.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, String> {

    List<RolePermission> findByRoleId(String roleId);

    void deleteByRoleId(String roleId);

    boolean existsByRoleIdAndPermissionId(String roleId, String permissionId);

    /** Lấy thẳng danh sách permission code của một role (nối qua id, một truy vấn). */
    @Query("SELECT p.code FROM Permission p, RolePermission rp " +
           "WHERE p.permissionId = rp.permissionId AND rp.roleId = :roleId")
    List<String> findPermissionCodesByRoleId(@Param("roleId") String roleId);
}
