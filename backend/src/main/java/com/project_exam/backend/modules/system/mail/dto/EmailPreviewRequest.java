package com.project_exam.backend.modules.system.mail.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Xem trước / gửi thử nội dung đang soạn (chưa lưu). Biến {{...}} được thay bằng dữ liệu
 * mẫu của chính admin đang thao tác.
 */
@Data
public class EmailPreviewRequest {

    @NotBlank(message = "Tiêu đề email không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung email không được để trống")
    private String bodyHtml;

    /** Chỉ dùng cho gửi thử; bỏ trống thì gửi về email của admin đang đăng nhập. */
    @Email(message = "Email nhận thử không đúng định dạng")
    private String toEmail;
}
