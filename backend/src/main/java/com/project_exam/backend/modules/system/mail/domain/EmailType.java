package com.project_exam.backend.modules.system.mail.domain;

import lombok.Getter;

@Getter
public enum EmailType {

    AUTO("Tự động theo sự kiện"),

    MANUAL("Soạn tay");

    private final String label;

    EmailType(String label) {
        this.label = label;
    }
}
