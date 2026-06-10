package com.project_exam.backend.modules.gamification.cosmetic.domain;

import lombok.Getter;

/** Loại đồ trang trí hồ sơ. Mỗi loại user chỉ đeo được 1 cái cùng lúc. */
@Getter
public enum CosmeticType {
    FRAME("Khung avatar"),
    BADGE("Huy hiệu");

    private final String label;

    CosmeticType(String label) {
        this.label = label;
    }
}
