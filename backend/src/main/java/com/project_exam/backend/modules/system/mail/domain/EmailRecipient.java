package com.project_exam.backend.modules.system.mail.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "email_recipients", schema = "system", indexes = {
        @Index(name = "idx_email_recipients_email_id", columnList = "email_id"),
        @Index(name = "idx_email_recipients_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailRecipient {

    @Id
    @UuidV7
    private String recipientId;

    @Column(name = "email_id", nullable = false)
    private String emailId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "to_email", nullable = false)
    private String toEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmailStatus status = EmailStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant sentAt;
}
