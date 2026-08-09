package com.project_exam.backend.modules.system.mail.domain;

import lombok.Getter;

@Getter
public enum EmailType {
    /** Mẫu gắn với sự kiện hệ thống, có `code` cố định, admin chỉ sửa nội dung. */
    AUTO("Tự động theo sự kiện"),
    /** Nội dung admin soạn tay rồi chọn người nhận để gửi. */
    MANUAL("Soạn tay");

    private final String label;

    EmailType(String label) {
        this.label = label;
    }
}
