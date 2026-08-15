package com.project_exam.backend.modules.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kết quả tra cứu công khai. Không lộ userId hay điểm số: người tra cứu chỉ cần biết
 * chứng chỉ này có thật, của ai và còn hiệu lực không.
 *
 * Có kèm design để trang tra cứu vẽ lại đúng tấm chứng chỉ đã cấp, không phải bảng
 * thông tin trông khác hẳn bản người học đang cầm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateVerifyResponse {
    private boolean valid;
    /** VALID | REVOKED | EXPIRED | NOT_FOUND */
    private String state;

    private String certificateCode;
    private String recipientName;
    private String title;
    private String examTypeName;
    private String issuerName;
    private Instant issuedAt;
    private Instant expiresAt;

    /** Bản chụp phôi lúc cấp, để vẽ lại chứng chỉ giống hệt trang xem của chủ sở hữu. */
    private CertificateDesign design;
}
