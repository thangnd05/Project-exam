package com.project_exam.backend.modules.system.mail.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Một nội dung email. AUTO là mẫu gắn với sự kiện (đăng ký, đổi mật khẩu...), MANUAL là
 * nội dung admin soạn tay để gửi cho danh sách người dùng tự chọn.
 */
@Entity
@Table(name = "emails", indexes = {
        @Index(name = "idx_emails_created_by", columnList = "created_by"),
        @Index(name = "idx_emails_updated_by", columnList = "updated_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Email {

    @Id
    @UuidV7
    private String emailId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private EmailType type = EmailType.MANUAL;

    /** Chỉ AUTO mới có, cố định theo {@link MailTemplateCode} nên admin không đổi được. */
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

    /** Danh sách biến {{...}} hợp lệ, ngăn cách bởi dấu phẩy  chỉ để gợi ý trên UI. */
    @Column(name = "available_vars", length = 500)
    private String availableVars;

    /** AUTO: tắt là ngừng gửi loại mail đó. MANUAL: tắt là ẩn khỏi danh sách dùng lại. */
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
}
