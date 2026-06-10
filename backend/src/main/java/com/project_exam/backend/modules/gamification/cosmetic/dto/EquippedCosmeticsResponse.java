package com.project_exam.backend.modules.gamification.cosmetic.dto;

import lombok.Builder;
import lombok.Getter;

/** Cosmetic user đang đeo — để hiển thị quanh avatar. null nếu không đeo. */
@Getter
@Builder
public class EquippedCosmeticsResponse {
    private CosmeticResponse frame;
    private CosmeticResponse badge;
}
