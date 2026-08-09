package com.project_exam.backend.modules.system.mail.domain;

import lombok.Getter;

@Getter
public enum EmailStatus {
    PENDING("Đang chờ gửi"),
    SENT("Đã gửi"),
    FAILED("Gửi lỗi");

    private final String label;

    EmailStatus(String label) {
        this.label = label;
    }
}
