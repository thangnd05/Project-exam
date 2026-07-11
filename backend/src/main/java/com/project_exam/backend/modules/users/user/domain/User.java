package com.project_exam.backend.modules.users.user.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_role_id", columnList = "role_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @UuidV7
    private String userId;

    @Column(nullable = false, unique = true, length = 50)
    private String userName; // nickname / tên đăng nhập

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "role_id", nullable = false)
    private String roleId;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean verified = false;
    private String verificationToken;

    @Column(name = "avatar_url")
    private String avatarUrl;

}
