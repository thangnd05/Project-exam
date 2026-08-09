package com.project_exam.backend.modules.system.mail.mapper;

import com.project_exam.backend.modules.system.mail.domain.Email;
import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.dto.EmailRecipientResponse;
import com.project_exam.backend.modules.system.mail.dto.EmailResponse;
import com.project_exam.backend.modules.users.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class EmailMapper {

    /** Số liệu gửi của một email, đếm sẵn theo trạng thái. */
    public record SendStats(long total, long sent, long failed, long pending) {
        public static final SendStats EMPTY = new SendStats(0, 0, 0, 0);
    }

    public EmailResponse toResponse(Email email, SendStats stats) {
        SendStats safe = stats != null ? stats : SendStats.EMPTY;
        return EmailResponse.builder()
                .emailId(email.getEmailId())
                .type(email.getType())
                .typeLabel(email.getType() == null ? null : email.getType().getLabel())
                .code(email.getCode())
                .name(email.getName())
                .description(email.getDescription())
                .subject(email.getSubject())
                .bodyHtml(email.getBodyHtml())
                .availableVars(parseVars(email.getAvailableVars()))
                .active(email.getActive())
                .createdAt(email.getCreatedAt())
                .updatedAt(email.getUpdatedAt())
                .totalCount(safe.total())
                .sentCount(safe.sent())
                .failedCount(safe.failed())
                .pendingCount(safe.pending())
                .build();
    }

    public EmailRecipientResponse toRecipientResponse(EmailRecipient recipient, Map<String, User> usersById) {
        User user = recipient.getUserId() == null ? null : usersById.get(recipient.getUserId());
        return EmailRecipientResponse.builder()
                .recipientId(recipient.getRecipientId())
                .userId(recipient.getUserId())
                .fullName(user != null ? user.getFullName() : null)
                .toEmail(recipient.getToEmail())
                .status(recipient.getStatus())
                .statusLabel(recipient.getStatus() == null ? null : recipient.getStatus().getLabel())
                .errorMessage(recipient.getErrorMessage())
                .createdAt(recipient.getCreatedAt())
                .sentAt(recipient.getSentAt())
                .build();
    }

    private List<String> parseVars(String availableVars) {
        if (availableVars == null || availableVars.isBlank()) {
            return List.of();
        }
        return Arrays.stream(availableVars.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
