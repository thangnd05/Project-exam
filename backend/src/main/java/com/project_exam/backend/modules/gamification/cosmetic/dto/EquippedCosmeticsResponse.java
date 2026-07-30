package com.project_exam.backend.modules.gamification.cosmetic.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EquippedCosmeticsResponse {
    private CosmeticResponse frame;
    private CosmeticResponse badge;
}
