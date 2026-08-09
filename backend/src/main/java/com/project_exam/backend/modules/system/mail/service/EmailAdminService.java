package com.project_exam.backend.modules.system.mail.service;

import com.project_exam.backend.modules.system.mail.domain.Email;
import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.domain.EmailStatus;
import com.project_exam.backend.modules.system.mail.domain.EmailType;
import com.project_exam.backend.modules.system.mail.dto.*;
import com.project_exam.backend.modules.system.mail.mapper.EmailMapper;
import com.project_exam.backend.modules.system.mail.repository.EmailRecipientRepository;
import com.project_exam.backend.modules.system.mail.repository.EmailRepository;
import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Nghiệp vụ cho trang quản trị email: sửa mẫu tự động, soạn và gửi email thủ công. */
@Service
@RequiredArgsConstructor
public class EmailAdminService {

    private final EmailRepository emailRepository;
    private final EmailRecipientRepository emailRecipientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailMapper emailMapper;
    private final MailService mailService;
    private final MailQueueWorker mailQueueWorker;

    // ------------------------------------------------------------------ đọc

    public List<EmailResponse> findAuto() {
        List<Email> emails = emailRepository.findByTypeOrderByCodeAsc(EmailType.AUTO);
        Map<String, EmailMapper.SendStats> stats = statsFor(emails);
        return emails.stream()
                .map(email -> emailMapper.toResponse(email, stats.get(email.getEmailId())))
                .toList();
    }

    public PageResponse<EmailResponse> findManual(int page, int size) {
        Page<Email> emails = emailRepository.findByTypeOrderByCreatedAtDesc(
                EmailType.MANUAL, PageRequest.of(page, size));
        Map<String, EmailMapper.SendStats> stats = statsFor(emails.getContent());
        return PageResponse.from(emails,
                email -> emailMapper.toResponse(email, stats.get(email.getEmailId())));
    }

    public PageResponse<EmailRecipientResponse> findRecipients(String emailId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EmailRecipient> recipients =
                emailRecipientRepository.findByEmailIdOrderByCreatedAtDesc(emailId, pageable);
        Map<String, User> usersById = loadUsers(recipients.getContent().stream()
                .map(EmailRecipient::getUserId)
                .filter(Objects::nonNull)
                .toList());
        return PageResponse.from(recipients,
                recipient -> emailMapper.toRecipientResponse(recipient, usersById));
    }

    /**
     * Danh sách người dùng để giao diện tự chọn người nhận. Trả kèm vai trò và cờ premium
     * để frontend lọc, backend không cần khái niệm "nhóm người nhận".
     */
    public List<MailAudienceOptionResponse> findAudienceOptions() {
        Map<String, String> roleNames = roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getRoleId, Role::getRoleName, (a, b) -> a));
        return userRepository.findAll().stream()
                .filter(user -> user.getEmail() != null && !user.getEmail().isBlank())
                .map(user -> MailAudienceOptionResponse.builder()
                        .userId(user.getUserId())
                        .userName(user.getUserName())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .roleId(user.getRoleId())
                        .roleName(roleNames.get(user.getRoleId()))
                        .isPremium(user.getIsPremium())
                        .build())
                .toList();
    }

    // ------------------------------------------------------------------ ghi

    @Transactional
    public EmailResponse createManual(EmailSaveRequest request, String adminId) {
        Email email = new Email();
        email.setType(EmailType.MANUAL);
        email.setName(request.getName());
        email.setDescription(request.getDescription());
        email.setSubject(request.getSubject());
        email.setBodyHtml(request.getBodyHtml());
        email.setActive(request.getActive() == null || request.getActive());
        email.setCreatedBy(adminId);
        email.setUpdatedBy(adminId);
        email.setCreatedAt(Instant.now());
        email.setUpdatedAt(Instant.now());
        emailRepository.save(email);
        return emailMapper.toResponse(email, EmailMapper.SendStats.EMPTY);
    }

    @Transactional
    public EmailResponse update(String emailId, EmailSaveRequest request, String adminId) {
        Email email = getEmail(emailId);
        // Mẫu AUTO giữ nguyên `code` và `type` — code Java tham chiếu trực tiếp tới chúng.
        if (email.getType() == EmailType.MANUAL) {
            email.setName(request.getName());
            email.setDescription(request.getDescription());
        }
        email.setSubject(request.getSubject());
        email.setBodyHtml(request.getBodyHtml());
        if (request.getActive() != null) {
            email.setActive(request.getActive());
        }
        email.setUpdatedBy(adminId);
        email.setUpdatedAt(Instant.now());
        emailRepository.save(email);
        return emailMapper.toResponse(email, statsFor(List.of(email)).get(emailId));
    }

    @Transactional
    public void delete(String emailId) {
        Email email = getEmail(emailId);
        if (email.getType() == EmailType.AUTO) {
            throw new BadRequestException("Không thể xóa mẫu email tự động của hệ thống.");
        }
        emailRepository.delete(email);
    }

    /** Xếp hàng gửi tới danh sách người dùng được chọn rồi bắn worker chạy nền. */
    @Transactional
    public EmailResponse send(String emailId, List<String> userIds, String adminId) {
        Email email = getEmail(emailId);
        if (email.getType() == EmailType.AUTO) {
            throw new BadRequestException(
                    "Mẫu email tự động được gửi theo sự kiện, không gửi thủ công.");
        }
        if (!Boolean.TRUE.equals(email.getActive())) {
            throw new BadRequestException("Email đang tắt, hãy bật lại trước khi gửi.");
        }

        List<User> users = userRepository.findAllById(new LinkedHashSet<>(userIds)).stream()
                .filter(user -> user.getEmail() != null && !user.getEmail().isBlank())
                .toList();
        if (users.isEmpty()) {
            throw new BadRequestException("Không có người nhận hợp lệ nào trong danh sách đã chọn.");
        }

        List<EmailRecipient> recipients = users.stream().map(user -> {
            EmailRecipient recipient = new EmailRecipient();
            recipient.setEmailId(emailId);
            recipient.setUserId(user.getUserId());
            recipient.setToEmail(user.getEmail());
            return recipient;
        }).toList();
        emailRecipientRepository.saveAll(recipients);

        runWorkerAfterCommit(emailId);
        return emailMapper.toResponse(email, statsFor(List.of(email)).get(emailId));
    }

    @Transactional
    public EmailResponse retryFailed(String emailId) {
        Email email = getEmail(emailId);
        // Mail AUTO không gửi lại được: nội dung phụ thuộc dữ liệu dùng một lần của lần gửi
        // đó (link đặt lại mật khẩu có token) mà hệ thống cố ý không lưu lại.
        if (email.getType() == EmailType.AUTO) {
            throw new BadRequestException(
                    "Email tự động không gửi lại được, người dùng cần thực hiện lại thao tác.");
        }
        int requeued = emailRecipientRepository.requeueFailed(emailId);
        if (requeued == 0) {
            throw new BadRequestException("Không có email lỗi nào để gửi lại.");
        }
        runWorkerAfterCommit(emailId);
        return emailMapper.toResponse(email, statsFor(List.of(email)).get(emailId));
    }

    // ------------------------------------------------- xem trước & gửi thử

    public EmailPreviewResponse preview(EmailPreviewRequest request, String adminId) {
        MailService.RenderedMail mail = mailService.render(
                request.getSubject(), request.getBodyHtml(), sampleVars(adminId));
        return EmailPreviewResponse.builder()
                .subject(mail.subject())
                .bodyHtml(mail.bodyHtml())
                .build();
    }

    /** Gửi thử nội dung đang soạn (chưa cần lưu) về một địa chỉ để kiểm tra hiển thị. */
    @Transactional
    public void testSend(String emailId, EmailPreviewRequest request, String adminId) {
        getEmail(emailId);
        User admin = userRepository.findById(adminId).orElse(null);
        String toEmail = request.getToEmail() != null && !request.getToEmail().isBlank()
                ? request.getToEmail()
                : (admin != null ? admin.getEmail() : null);
        if (toEmail == null || toEmail.isBlank()) {
            throw new BadRequestException("Không xác định được địa chỉ nhận email thử.");
        }

        MailService.RenderedMail mail = mailService.render(
                request.getSubject(), request.getBodyHtml(), sampleVars(adminId));
        mailService.queueAndDispatch(emailId, adminId, toEmail, mail);
    }

    /** Dữ liệu mẫu để mọi biến {{...}} đều hiện ra giá trị thật khi xem trước. */
    private Map<String, String> sampleVars(String adminId) {
        User admin = adminId == null ? null : userRepository.findById(adminId).orElse(null);
        Map<String, String> vars = new HashMap<>();
        vars.put("fullName", admin != null ? admin.getFullName() : "Nguyễn Văn A");
        vars.put("userName", admin != null ? admin.getUserName() : "nguyenvana");
        vars.put("email", admin != null ? admin.getEmail() : "nguyenvana@example.com");
        vars.put("oldEmail", "email-cu@example.com");
        vars.put("newEmail", admin != null ? admin.getEmail() : "email-moi@example.com");
        vars.put("changedAt", mailService.formatDateTime(Instant.now()));
        vars.put("expireMinutes", "30");
        Map<String, String> global = mailService.globalVars();
        vars.put("actionUrl", global.get("siteUrl"));
        vars.put("loginUrl", global.get("siteUrl") + "/login");
        return vars;
    }

    // -------------------------------------------------------------- nội bộ

    private Email getEmail(String emailId) {
        return emailRepository.findById(emailId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy email"));
    }

    /**
     * Worker chỉ được chạy sau khi các dòng người nhận đã commit, nếu không luồng nền có
     * thể quét bảng trước lúc dữ liệu hiện ra và tưởng không có gì để gửi.
     */
    private void runWorkerAfterCommit(String emailId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            mailQueueWorker.run(emailId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                mailQueueWorker.run(emailId);
            }
        });
    }

    private Map<String, EmailMapper.SendStats> statsFor(List<Email> emails) {
        if (emails.isEmpty()) {
            return Map.of();
        }
        List<String> emailIds = emails.stream().map(Email::getEmailId).toList();
        Map<String, Map<EmailStatus, Long>> raw = new HashMap<>();
        for (Object[] row : emailRecipientRepository.countGroupedByEmailIds(emailIds)) {
            raw.computeIfAbsent((String) row[0], key -> new EnumMap<>(EmailStatus.class))
                    .put((EmailStatus) row[1], (Long) row[2]);
        }

        Map<String, EmailMapper.SendStats> result = new HashMap<>();
        for (String emailId : emailIds) {
            Map<EmailStatus, Long> counts = raw.getOrDefault(emailId, Map.of());
            long sent = counts.getOrDefault(EmailStatus.SENT, 0L);
            long failed = counts.getOrDefault(EmailStatus.FAILED, 0L);
            long pending = counts.getOrDefault(EmailStatus.PENDING, 0L);
            result.put(emailId, new EmailMapper.SendStats(sent + failed + pending, sent, failed, pending));
        }
        return result;
    }

    private Map<String, User> loadUsers(List<String> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(new LinkedHashSet<>(userIds)).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
    }
}
