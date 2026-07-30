package com.project_exam.backend.modules.gamification.cosmetic.mapper;

import com.project_exam.backend.modules.gamification.cosmetic.domain.Cosmetic;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import org.springframework.stereotype.Component;

@Component
public class CosmeticMapper {

    public CosmeticResponse toResponse(Cosmetic cosmetic, Boolean owned, Boolean equipped) {
        return CosmeticResponse.builder()
                .cosmeticId(cosmetic.getCosmeticId())
                .name(cosmetic.getName())
                .description(cosmetic.getDescription())
                .type(cosmetic.getType())
                .typeLabel(cosmetic.getType() == null ? null : cosmetic.getType().getLabel())
                .costCoins(cosmetic.getCostCoins())
                .assetValue(cosmetic.getAssetValue())
                .frameStyle(cosmetic.getFrameStyle())
                .imageUrl(cosmetic.getImageUrl())
                .active(cosmetic.getActive())
                .displayOrder(cosmetic.getDisplayOrder())
                .owned(owned)
                .equipped(equipped)
                .build();
    }
}
