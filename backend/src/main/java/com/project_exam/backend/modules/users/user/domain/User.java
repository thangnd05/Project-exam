package com.project_exam.backend.modules.users.user.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users", schema = "users", indexes = {
        @Index(name = "idx_users_role_id", columnList = "role_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE users.users SET deleted_at = now() WHERE user_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class User {
    @Id
    @UuidV7
    private String userId;

    @Column(nullable = false, unique = true, length = 50)
    private String userName;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "role_id", nullable = false)
    private String roleId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Boolean verified = false;
    private String verificationToken;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_premium", nullable = false)
    private Boolean isPremium = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

}
