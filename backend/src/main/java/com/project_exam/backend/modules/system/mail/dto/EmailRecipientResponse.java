package com.project_exam.backend.modules.system.mail.dto;

import com.project_exam.backend.modules.system.mail.domain.EmailStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class EmailRecipientResponse {
    private String recipientId;
    private String userId;
    private String fullName;
    private String toEmail;
    private EmailStatus status;
    private String statusLabel;
    private String errorMessage;
    private Instant createdAt;
    private Instant sentAt;
}
