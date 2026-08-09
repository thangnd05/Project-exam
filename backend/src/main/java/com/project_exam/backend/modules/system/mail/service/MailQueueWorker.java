package com.project_exam.backend.modules.system.mail.service;

import com.project_exam.backend.modules.system.mail.domain.Email;
import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.domain.EmailStatus;
import com.project_exam.backend.modules.system.mail.repository.EmailRecipientRepository;
import com.project_exam.backend.modules.system.mail.repository.EmailRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gửi lần lượt các người nhận còn PENDING của một email.
 *
 * Chạy trên một luồng nền duy nhất cho cả đợt gửi thay vì bắn mỗi mail một task: SMTP
 * (nhất là Gmail) chặn khi bị dội quá nhanh, nên giữa mỗi lô có quãng nghỉ.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MailQueueWorker {

    private final EmailRepository emailRepository;
    private final EmailRecipientRepository emailRecipientRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final MailDispatcher mailDispatcher;

    @Value("${app.mail.batch-size:50}")
    private int batchSize;

    @Value("${app.mail.batch-delay-ms:1000}")
    private long batchDelayMs;

    @Async("mailExecutor")
    public void run(String emailId) {
        Email email = emailRepository.findById(emailId).orElse(null);
        if (email == null) {
            return;
        }

        List<EmailRecipient> pending =
                emailRecipientRepository.findByEmailIdAndStatus(emailId, EmailStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }

        Map<String, User> usersById = loadUsers(pending);
        int sent = 0;

        for (int i = 0; i < pending.size(); i++) {
            EmailRecipient recipient = pending.get(i);
            try {
                User user = recipient.getUserId() == null ? null : usersById.get(recipient.getUserId());
                MailService.RenderedMail mail = mailService.render(
                        email.getSubject(), email.getBodyHtml(), userVars(user, recipient));
                if (mailDispatcher.deliver(recipient.getRecipientId(), recipient.getToEmail(),
                        mail.subject(), mail.bodyHtml())) {
                    sent++;
                }
            } catch (Exception e) {
                log.warn("Lỗi khi dựng nội dung email cho {}: {}", recipient.getToEmail(), e.getMessage());
            }

            boolean endOfBatch = (i + 1) % batchSize == 0;
            if (endOfBatch && i + 1 < pending.size() && batchDelayMs > 0) {
                sleep();
            }
        }

        log.info("Gửi xong email {}: {}/{} thành công", emailId, sent, pending.size());
    }

    /** Mỗi người nhận có {{fullName}} của riêng mình nên nội dung render lại theo từng người. */
    private Map<String, String> userVars(User user, EmailRecipient recipient) {
        Map<String, String> vars = new HashMap<>();
        vars.put("email", recipient.getToEmail());
        vars.put("fullName", user != null ? user.getFullName() : "bạn");
        vars.put("userName", user != null ? user.getUserName() : "");
        return vars;
    }

    private Map<String, User> loadUsers(List<EmailRecipient> recipients) {
        List<String> userIds = recipients.stream()
                .map(EmailRecipient::getUserId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, user -> user));
    }

    private void sleep() {
        try {
            Thread.sleep(batchDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
