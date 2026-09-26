package com.project_exam.backend.modules.assessment.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateVerifyResponse {
    private boolean valid;

    private String state;

    private String certificateCode;
    private String recipientName;
    private String title;
    private String examTypeName;
    private String issuerName;
    private Instant issuedAt;
    private Instant expiresAt;

    private CertificateDesign design;
}
