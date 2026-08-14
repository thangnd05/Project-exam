package com.project_exam.backend.modules.system.mail.service;

import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.domain.EmailStatus;
import com.project_exam.backend.modules.system.mail.repository.EmailRecipientRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.time.Instant;

/**
 * Nơi duy nhất thực sự đẩy mail ra SMTP và ghi kết quả vào email_recipients.
 *
 * Tách khỏi MailService vì @Async chỉ hoạt động khi gọi qua proxy Spring  gọi method
 * @Async trong cùng một bean sẽ chạy đồng bộ như thường.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MailDispatcher {

    private final JavaMailSender javaMailSender;
    private final EmailRecipientRepository emailRecipientRepository;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    /** Gửi nền cho mail giao dịch lẻ (đăng ký, đổi mật khẩu...). */
    @Async("mailExecutor")
    public void dispatchAsync(String recipientId, String toEmail, String subject, String bodyHtml) {
        deliver(recipientId, toEmail, subject, bodyHtml);
    }

    /**
     * Gửi ngay trên luồng hiện tại  dùng cho worker gửi hàng loạt (bản thân nó đã chạy
     * nền, nếu bắn tiếp @Async cho từng mail thì hàng nghìn task sẽ tràn queue).
     *
     * @return true nếu gửi thành công.
     */
    public boolean deliver(String recipientId, String toEmail, String subject, String bodyHtml) {
        String error = null;
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            try {
                helper.setFrom(fromAddress, fromName);
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true);
            javaMailSender.send(message);
        } catch (Exception e) {
            error = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.warn("Gửi email tới {} thất bại: {}", toEmail, error);
        }
        markResult(recipientId, error);
        return error == null;
    }

    private void markResult(String recipientId, String error) {
        if (recipientId == null) {
            return;
        }
        EmailRecipient recipient = emailRecipientRepository.findById(recipientId).orElse(null);
        if (recipient == null) {
            return;
        }
        recipient.setStatus(error == null ? EmailStatus.SENT : EmailStatus.FAILED);
        recipient.setErrorMessage(error);
        recipient.setSentAt(Instant.now());
        emailRecipientRepository.save(recipient);
    }
}
