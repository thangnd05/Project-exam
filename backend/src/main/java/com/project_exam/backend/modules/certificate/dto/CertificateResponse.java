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
public class CertificateResponse {
    private String certificateId;
    private String certificateCode;
    private String recipientName;
    private String examTypeId;
    private String testTitle;
    private Integer score;
    private String status;

    private Instant issuedAt;
    private Instant expiresAt;
    private boolean expired;

    /** Bản chụp phần trình bày lúc cấp, frontend dùng để vẽ chứng chỉ. */
    private CertificateDesign design;

    /** Chỉ có ở màn quản trị. */
    private String userId;
    private String userTestId;
    private String revokedReason;
    private Instant revokedAt;
}
