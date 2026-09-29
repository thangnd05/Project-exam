package com.project_exam.backend.modules.system.mail.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "emails", schema = "system", indexes = {
        @Index(name = "idx_emails_created_by", columnList = "created_by"),
        @Index(name = "idx_emails_updated_by", columnList = "updated_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE system.emails SET deleted_at = now() WHERE email_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Email {

    @Id
    @UuidV7
    private String emailId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private EmailType type = EmailType.MANUAL;

    @Column(unique = true, length = 64)
    private String code;

    @Column(length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String subject;

    @Column(name = "body_html", nullable = false, columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "available_vars", length = 500)
    private String availableVars;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
