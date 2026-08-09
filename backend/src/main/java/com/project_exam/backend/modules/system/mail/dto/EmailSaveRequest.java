package com.project_exam.backend.modules.system.mail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Dùng chung cho tạo email MANUAL và sửa nội dung email (cả AUTO lẫn MANUAL). */
@Data
public class EmailSaveRequest {

    @Size(max = 150, message = "Tên tối đa 150 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    @NotBlank(message = "Tiêu đề email không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung email không được để trống")
    private String bodyHtml;

    private Boolean active;
}
