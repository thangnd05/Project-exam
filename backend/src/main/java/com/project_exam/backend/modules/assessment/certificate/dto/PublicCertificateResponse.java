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
public class PublicCertificateResponse {
    private String certificateCode;
    private String recipientName;
    private String title;
    private String examTypeId;
    private String examTypeName;
    private Instant issuedAt;
    private Instant expiresAt;
    private String logoUrl;
    private String accentColor;
    private CertificateDesign design;
}
