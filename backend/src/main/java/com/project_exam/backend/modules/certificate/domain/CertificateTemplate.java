package com.project_exam.backend.modules.certificate.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

/**
 * Mẫu chứng chỉ của một loại đề. Chứng chỉ chỉ có Đạt / Chưa đạt nên điều kiện cấp
 * gói gọn trong passScore, phần còn lại thuần trình bày.
 */
@Entity
@Table(name = "certificate_templates", indexes = {
        @Index(name = "idx_certificate_templates_exam_type_id", columnList = "exam_type_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplate {

    @Id
    @UuidV7
    @Column(name = "template_id")
    private String templateId;

    @Column(name = "exam_type_id", nullable = false, unique = true)
    private String examTypeId;

    @Column(nullable = false)
    private Boolean active = true;

    /** Ngưỡng đạt theo thang điểm của loại đề (AWS_SCALE: 100-1000, chuẩn AWS là 720). */
    @Column(name = "pass_score", nullable = false)
    private Integer passScore;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 300)
    private String subtitle;

    /**
     * Câu mô tả ở giữa chứng chỉ. Bỏ trống thì frontend dùng câu mặc định
     * "for successfully completing and passing the &lt;loại đề&gt; examination".
     */
    @Column(name = "body_text", length = 500)
    private String bodyText;

    @Column(name = "footer_note", length = 500)
    private String footerNote;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "background_url", length = 500)
    private String backgroundUrl;

    @Column(name = "accent_color", length = 20)
    private String accentColor;

    @Column(name = "issuer_name", length = 150)
    private String issuerName;

    @Column(name = "signature_name", length = 150)
    private String signatureName;

    @Column(name = "signature_title", length = 150)
    private String signatureTitle;

    @Column(name = "signature_image_url", length = 500)
    private String signatureImageUrl;

    /** null = chứng chỉ vô thời hạn. */
    @Column(name = "valid_months")
    private Integer validMonths;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
