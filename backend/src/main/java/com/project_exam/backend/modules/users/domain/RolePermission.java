package com.project_exam.backend.modules.users.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Bảng nối role ↔ permission (RBAC granular). Nối qua id thường theo convention dự án
 * (không dùng @ManyToMany/@OneToMany). Mỗi dòng = một role được gán một permission.
 */
@Entity
@Table(
        name = "role_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "role_id", nullable = false)
    private String roleId;

    @Column(name = "permission_id", nullable = false)
    private String permissionId;
}
