package com.project_exam.backend.modules.auth.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "email_verifications", indexes = {
        @Index(name = "idx_email_verifications_user_id", columnList = "user_id"),
        @Index(name = "idx_email_verifications_token", columnList = "token")
})
@Getter
@Setter
public class EmailVerification {

    @Id
    @UuidV7
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    private String token;
    private Instant expiresAt;
    private String status = "PENDING";
    private Instant createdAt = Instant.now();

}
