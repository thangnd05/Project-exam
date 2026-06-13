package com.project_exam.backend.modules.gamification.cosmetic.mapper;

import com.project_exam.backend.modules.gamification.cosmetic.domain.Cosmetic;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import org.springframework.stereotype.Component;

/** Mapper thuần: dựng DTO từ dữ liệu đã được service chuẩn bị sẵn. */
@Component
public class CosmeticMapper {

    /**
     * Cosmetic kèm cờ owned/equipped. owned/equipped có thể null (vd danh sách admin
     * không quan tâm sở hữu của 1 user cụ thể).
     */
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
