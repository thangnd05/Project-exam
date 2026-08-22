package com.project_exam.backend.modules.certificate.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phần trình bày của chứng chỉ. Vừa là hình dạng chụp lại vào
 * user_certificates.template_snapshot, vừa là thứ frontend nhận để vẽ  nhờ vậy
 * xem chứng chỉ, tra cứu công khai và xem trước ở trang admin dùng chung một component.
 *
 * @JsonIgnoreProperties để chứng chỉ cũ đọc lại được sau khi thêm trường mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CertificateDesign {
    private String title;
    private String subtitle;
    /** Câu mô tả giữa chứng chỉ; null = frontend dùng câu mặc định theo tên loại đề. */
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
