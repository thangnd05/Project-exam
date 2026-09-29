
package com.project_exam.backend.modules.users.rbac.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "roles", schema = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE users.roles SET deleted_at = now() WHERE role_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Role {
    @Id
    @UuidV7
    private String roleId;

    @Column(nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "deleted_at")
    private Instant deletedAt;

}
