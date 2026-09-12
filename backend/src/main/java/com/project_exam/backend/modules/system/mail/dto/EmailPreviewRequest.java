package com.project_exam.backend.modules.system.mail.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailPreviewRequest {

    @NotBlank(message = "Tiêu đề email không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung email không được để trống")
    private String bodyHtml;

    @Email(message = "Email nhận thử không đúng định dạng")
    private String toEmail;
}
