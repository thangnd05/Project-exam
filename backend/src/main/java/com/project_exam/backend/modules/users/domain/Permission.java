package com.project_exam.backend.modules.users.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Một permission = một hành động quản lý có thể gán cho role (RBAC granular).
 * code: định danh ổn định dùng để check quyền, vd "EXAM_TYPE:MANAGE" (xem {@link com.project_exam.backend.shared.security.PermissionCatalog}).
 * groupName: gom nhóm để hiển thị ma trận phân quyền trên UI admin.
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String permissionId;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(length = 255)
    private String description;

    @Column(name = "permission_group", length = 50)
    private String groupName;
}
