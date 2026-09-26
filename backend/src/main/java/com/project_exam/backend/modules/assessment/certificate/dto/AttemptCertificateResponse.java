package com.project_exam.backend.modules.assessment.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptCertificateResponse {
    private String state;
    private Integer score;
    private Integer passScore;

    private Integer pointsToPass;
    private CertificateResponse certificate;
}
