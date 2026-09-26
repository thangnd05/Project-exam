package com.project_exam.backend.modules.assessment.certificate.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CertificateDesign {
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
    private String examTypeName;
}
