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

@Slf4j
@Component
@RequiredArgsConstructor
public class MailDispatcher {

    private final JavaMailSender javaMailSender;
    private final EmailRecipientRepository emailRecipientRepository;
    private final EmailHtmlNormalizer htmlNormalizer;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Async("mailExecutor")
    public void dispatchAsync(String recipientId, String toEmail, String subject, String bodyHtml) {
        deliver(recipientId, toEmail, subject, bodyHtml);
    }

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
            helper.setReplyTo(fromAddress);
            helper.setSubject(subject);
            String plainText = htmlNormalizer.toPlainText(bodyHtml);
            if (plainText.isBlank()) {
                helper.setText(bodyHtml, true);
            } else {
                helper.setText(plainText, bodyHtml);
            }
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
