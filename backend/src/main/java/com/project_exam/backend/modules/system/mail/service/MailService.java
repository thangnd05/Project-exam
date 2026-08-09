package com.project_exam.backend.modules.system.mail.service;

import com.project_exam.backend.modules.system.mail.domain.Email;
import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.domain.MailTemplateCode;
import com.project_exam.backend.modules.system.mail.repository.EmailRecipientRepository;
import com.project_exam.backend.modules.system.mail.repository.EmailRepository;
import com.project_exam.backend.shared.util.AppTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Điểm vào duy nhất để gửi email trong hệ thống.
 *
 * Nguyên tắc: gửi mail KHÔNG được làm hỏng nghiệp vụ gọi nó. Mọi lỗi (thiếu mẫu, SMTP
 * chết...) đều nuốt lại và ghi vào email_recipients để admin gửi lại, chứ không ném
 * ngược lên khiến người dùng đăng ký hụt hay đổi mật khẩu hụt.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private static final DateTimeFormatter DATE_TIME =
            DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy");

    private final EmailRepository emailRepository;
    private final EmailRecipientRepository emailRecipientRepository;
    private final MailTemplateRenderer renderer;
    private final EmailHtmlNormalizer htmlNormalizer;
    private final MailDispatcher mailDispatcher;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    @Value("${app.mail.site-name}")
    private String siteName;

    /** Nội dung một email đã render xong, sẵn sàng đẩy ra SMTP. */
    public record RenderedMail(String subject, String bodyHtml) {}

    /** Biến dùng được ở mọi template, không cần bên gọi truyền. */
    public Map<String, String> globalVars() {
        Map<String, String> vars = new HashMap<>();
        vars.put("siteName", siteName);
        vars.put("siteUrl", frontendOrigin);
        vars.put("year", String.valueOf(AppTime.today().getYear()));
        return vars;
    }

    public String formatDateTime(Instant instant) {
        return instant == null ? "" : DATE_TIME.format(AppTime.local(instant));
    }

    /**
     * Gửi một mail AUTO theo mã template.
     *
     * @param code    mã trong {@link MailTemplateCode}
     * @param toEmail địa chỉ nhận (truyền riêng vì mail đổi email phải gửi về địa chỉ cũ)
     * @param userId  chủ tài khoản liên quan, có thể null
     * @param vars    biến riêng của mail này, gộp thêm với {@link #globalVars()}
     */
    public void sendAuto(String code, String toEmail, String userId, Map<String, String> vars) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        try {
            Email template = emailRepository.findByCode(code).orElse(null);
            if (template == null) {
                log.warn("Không tìm thấy mẫu email {} — bỏ qua lần gửi này", code);
                return;
            }
            if (!Boolean.TRUE.equals(template.getActive())) {
                log.info("Mẫu email {} đang tắt — bỏ qua lần gửi này", code);
                return;
            }

            RenderedMail mail = render(template.getSubject(), template.getBodyHtml(), vars);
            queueAndDispatch(template.getEmailId(), userId, toEmail, mail);
        } catch (Exception e) {
            log.error("Không chuẩn bị được email {} cho {}: {}", code, toEmail, e.getMessage());
        }
    }

    /** Render tiêu đề + nội dung rồi bọc vào khung LAYOUT_BASE. */
    public RenderedMail render(String subject, String bodyHtml, Map<String, String> vars) {
        Map<String, String> merged = globalVars();
        if (vars != null) {
            merged.putAll(vars);
        }
        String renderedSubject = renderer.render(subject, merged);
        // Nội dung soạn bằng trình soạn thảo phải đổi sang style inline mới hiển thị đúng
        // trong hộp thư. Khung LAYOUT_BASE thì không cần vì vốn đã là HTML email viết tay.
        String renderedContent = htmlNormalizer.toEmailHtml(renderer.render(bodyHtml, merged));
        return new RenderedMail(renderedSubject, wrapLayout(renderedContent, merged));
    }

    private String wrapLayout(String content, Map<String, String> vars) {
        Email layout = emailRepository.findByCode(MailTemplateCode.LAYOUT_BASE).orElse(null);
        if (layout == null || !Boolean.TRUE.equals(layout.getActive())) {
            return content;
        }
        Map<String, String> layoutVars = new HashMap<>(vars);
        layoutVars.put("content", content);
        return renderer.render(layout.getBodyHtml(), layoutVars);
    }

    /**
     * Ghi một dòng nhật ký rồi đẩy gửi nền.
     *
     * Nội dung đã render được truyền thẳng cho luồng gửi chứ không lưu xuống bảng: dòng
     * nhật ký chỉ cần biết gửi email nào, cho ai, kết quả ra sao.
     */
    public void queueAndDispatch(String emailId, String userId, String toEmail, RenderedMail mail) {
        EmailRecipient recipient = new EmailRecipient();
        recipient.setEmailId(emailId);
        recipient.setUserId(userId);
        recipient.setToEmail(toEmail);
        emailRecipientRepository.save(recipient);

        dispatchAfterCommit(recipient.getRecipientId(), toEmail, mail);
    }

    /**
     * Chờ transaction của bên gọi commit xong mới bắn luồng gửi. Nếu bắn ngay, luồng nền
     * có thể chạy trước lúc commit và không thấy dòng recipient vừa insert.
     */
    private void dispatchAfterCommit(String recipientId, String toEmail, RenderedMail mail) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            mailDispatcher.dispatchAsync(recipientId, toEmail, mail.subject(), mail.bodyHtml());
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                mailDispatcher.dispatchAsync(recipientId, toEmail, mail.subject(), mail.bodyHtml());
            }
        });
    }
}
