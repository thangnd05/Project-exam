package com.project_exam.backend.modules.certificate.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CertificateTemplateRequest {

    @NotBlank(message = "Loại đề không được để trống")
    private String examTypeId;

    @NotNull(message = "Điểm đạt không được để trống")
    @Min(value = 0, message = "Điểm đạt phải là số không âm")
    private Integer passScore;

    @NotBlank(message = "Tên chứng chỉ không được để trống")
    @Size(max = 200)
    private String title;

    @Size(max = 300)
    private String subtitle;

    @Size(max = 500)
    private String footerNote;

    @Size(max = 500)
    private String logoUrl;

    @Size(max = 500)
    private String backgroundUrl;

    @Size(max = 20)
    private String accentColor;

    @Size(max = 150)
    private String issuerName;

    @Size(max = 150)
    private String signatureName;

    @Size(max = 150)
    private String signatureTitle;

    @Size(max = 500)
    private String signatureImageUrl;

    @Min(value = 1, message = "Thời hạn phải từ 1 tháng trở lên")
    private Integer validMonths;

    private Boolean active;
}
