package com.project_exam.backend.modules.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplateResponse {
    private String templateId;
    private String examTypeId;
    private String examTypeName;
    private Boolean active;
    private Integer passScore;

    private String title;
    private String subtitle;
    private String bodyText;
    private String footerNote;
    private String logoUrl;
    private String backgroundUrl;
    private String accentColor;
    private String issuerName;
    private String signatureName;
    private String signatureTitle;
    private String signatureImageUrl;
    private Integer validMonths;

    /** Số chứng chỉ còn hiệu lực đã cấp theo mẫu này. */
    private Long issuedCount;

    private Instant createdAt;
    private Instant updatedAt;
}
