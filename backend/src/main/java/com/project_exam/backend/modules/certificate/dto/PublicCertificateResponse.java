package com.project_exam.backend.modules.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Một dòng trên bảng vinh danh công khai ở trang tra cứu.
 *
 * Chỉ mang đúng những gì đã in trên tấm chứng chỉ: người tra cứu thấy ai đạt chứng chỉ gì,
 * bấm vào là sang trang xác thực bằng mã. Cố ý không có certificateId, userId, userTestId
 * hay điểm số — đó là dữ liệu của chủ sở hữu, không phải của người xem.
 */
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

    /** Lấy từ snapshot phôi, để vẽ huy hiệu nhỏ đúng nhận diện của loại chứng chỉ. */
    private String logoUrl;
    private String accentColor;
}
