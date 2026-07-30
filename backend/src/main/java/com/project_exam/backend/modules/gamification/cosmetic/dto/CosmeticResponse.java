package com.project_exam.backend.modules.gamification.cosmetic.dto;

import com.project_exam.backend.modules.gamification.cosmetic.domain.CosmeticType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CosmeticResponse {
    private String cosmeticId;
    private String name;
    private String description;
    private CosmeticType type;
    private String typeLabel;
    private Integer costCoins;
    private String assetValue;
    private String frameStyle;
    private String imageUrl;
    private Boolean active;
    private Integer displayOrder;
    private Boolean owned;
    private Boolean equipped;
}
