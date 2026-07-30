package com.project_exam.backend.modules.users.rbac.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(
        name = "role_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"}),
        indexes = {
                @Index(name = "idx_role_permissions_permission_id", columnList = "permission_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermission {
    @Id
    @UuidV7
    private String id;

    @Column(name = "role_id", nullable = false)
    private String roleId;

    @Column(name = "permission_id", nullable = false)
    private String permissionId;
}
