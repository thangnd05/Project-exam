package com.project_exam.backend.modules.assessment.certificate.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_certificates", indexes = {
        @Index(name = "idx_user_certificates_user_id", columnList = "user_id"),
        @Index(name = "idx_user_certificates_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_user_certificates_user_test_id", columnList = "user_test_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCertificate {

    @Id
    @UuidV7
    @Column(name = "certificate_id")
    private String certificateId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    @Column(name = "template_id")
    private String templateId;

    @Column(name = "user_test_id")
    private String userTestId;

    @Column(name = "test_id")
    private String testId;

    @Column(name = "certificate_code", nullable = false, unique = true, length = 40)
    private String certificateCode;

    @Column(nullable = false)
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "test_title")
    private String testTitle;

    @Column(name = "template_snapshot", nullable = false, columnDefinition = "TEXT")
    private String templateSnapshot;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_reason", length = 500)
    private String revokedReason;

    public enum Status {
        ACTIVE,
        REVOKED
    }

    public boolean isExpired(Instant now) {
        return expiresAt != null && now.isAfter(expiresAt);
    }
}
