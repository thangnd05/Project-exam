package com.project_exam.backend.modules.certificate.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.certificate.domain.CertificateTemplate;
import com.project_exam.backend.modules.certificate.domain.UserCertificate;
import com.project_exam.backend.modules.certificate.dto.CertificateDesign;
import com.project_exam.backend.modules.certificate.dto.CertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateTemplateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateVerifyResponse;
import com.project_exam.backend.modules.certificate.dto.PublicCertificateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class CertificateMapper {

    private final ObjectMapper objectMapper;

    public CertificateDesign toDesign(CertificateTemplate template, String examTypeName) {
        return CertificateDesign.builder()
                .title(template.getTitle())
                .subtitle(template.getSubtitle())
                .footerNote(template.getFooterNote())
                .logoUrl(template.getLogoUrl())
                .backgroundUrl(template.getBackgroundUrl())
                .accentColor(template.getAccentColor())
                .issuerName(template.getIssuerName())
                .signatureName(template.getSignatureName())
                .signatureTitle(template.getSignatureTitle())
                .signatureImageUrl(template.getSignatureImageUrl())
                .examTypeName(examTypeName)
                .build();
    }

    public String writeSnapshot(CertificateDesign design) {
        try {
            return objectMapper.writeValueAsString(design);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /**
     * Chứng chỉ cũ vẫn phải đọc được kể cả khi snapshot hỏng, nên lỗi parse trả về
     * design rỗng chứ không ném  người dùng thà thấy chứng chỉ trơ còn hơn lỗi 500.
     */
    public CertificateDesign readSnapshot(String snapshot) {
        if (snapshot == null || snapshot.isBlank()) {
            return CertificateDesign.builder().build();
        }
        try {
            return objectMapper.readValue(snapshot, CertificateDesign.class);
        } catch (JsonProcessingException e) {
            return CertificateDesign.builder().build();
        }
    }

    public CertificateResponse toResponse(UserCertificate certificate, boolean includeAdminFields) {
        CertificateResponse.CertificateResponseBuilder builder = CertificateResponse.builder()
                .certificateId(certificate.getCertificateId())
                .certificateCode(certificate.getCertificateCode())
                .recipientName(certificate.getRecipientName())
                .examTypeId(certificate.getExamTypeId())
                .testTitle(certificate.getTestTitle())
                .score(certificate.getScore())
                .status(certificate.getStatus().name())
                .issuedAt(certificate.getIssuedAt())
                .expiresAt(certificate.getExpiresAt())
                .expired(certificate.isExpired(Instant.now()))
                .design(readSnapshot(certificate.getTemplateSnapshot()));

        if (includeAdminFields) {
            builder.userId(certificate.getUserId())
                    .userTestId(certificate.getUserTestId())
                    .revokedReason(certificate.getRevokedReason())
                    .revokedAt(certificate.getRevokedAt());
        }
        return builder.build();
    }

    public CertificateTemplateResponse toTemplateResponse(CertificateTemplate template,
                                                          String examTypeName,
                                                          Long issuedCount) {
        return CertificateTemplateResponse.builder()
                .templateId(template.getTemplateId())
                .examTypeId(template.getExamTypeId())
                .examTypeName(examTypeName)
                .active(template.getActive())
                .passScore(template.getPassScore())
                .title(template.getTitle())
                .subtitle(template.getSubtitle())
                .footerNote(template.getFooterNote())
                .logoUrl(template.getLogoUrl())
                .backgroundUrl(template.getBackgroundUrl())
                .accentColor(template.getAccentColor())
                .issuerName(template.getIssuerName())
                .signatureName(template.getSignatureName())
                .signatureTitle(template.getSignatureTitle())
                .signatureImageUrl(template.getSignatureImageUrl())
                .validMonths(template.getValidMonths())
                .issuedCount(issuedCount)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    /** Dòng danh sách công khai: đọc phần trình bày từ snapshot, bỏ hết dữ liệu riêng của chủ sở hữu. */
    public PublicCertificateResponse toPublicResponse(UserCertificate certificate) {
        CertificateDesign design = readSnapshot(certificate.getTemplateSnapshot());
        return PublicCertificateResponse.builder()
                .certificateCode(certificate.getCertificateCode())
                .recipientName(certificate.getRecipientName())
                .title(design.getTitle())
                .examTypeId(certificate.getExamTypeId())
                .examTypeName(design.getExamTypeName())
                .issuedAt(certificate.getIssuedAt())
                .expiresAt(certificate.getExpiresAt())
                .logoUrl(design.getLogoUrl())
                .accentColor(design.getAccentColor())
                .build();
    }

    public CertificateVerifyResponse toVerifyResponse(UserCertificate certificate, String state) {
        CertificateDesign design = readSnapshot(certificate.getTemplateSnapshot());
        return CertificateVerifyResponse.builder()
                .valid("VALID".equals(state))
                .state(state)
                .certificateCode(certificate.getCertificateCode())
                .recipientName(certificate.getRecipientName())
                .title(design.getTitle())
                .examTypeName(design.getExamTypeName())
                .issuerName(design.getIssuerName())
                .issuedAt(certificate.getIssuedAt())
                .expiresAt(certificate.getExpiresAt())
                .design(design)
                .build();
    }

    public CertificateVerifyResponse notFound(String code) {
        return CertificateVerifyResponse.builder()
                .valid(false)
                .state("NOT_FOUND")
                .certificateCode(code)
                .build();
    }
}
