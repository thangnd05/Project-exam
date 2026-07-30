package com.project_exam.backend.modules.gamification.cosmetic.domain;

import lombok.Getter;

@Getter
public enum CosmeticType {
    FRAME("Khung avatar"),
    BADGE("Huy hiệu");

    private final String label;

    CosmeticType(String label) {
        this.label = label;
    }
}
