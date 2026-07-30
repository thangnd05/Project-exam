package com.project_exam.backend.modules.gamification.cosmetic.dto;

import com.project_exam.backend.modules.gamification.cosmetic.domain.CosmeticType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class CosmeticRequest {
    @NotBlank(message = "Tên không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Loại không được để trống")
    private CosmeticType type;

    @NotNull(message = "Giá xu không được để trống")
    @PositiveOrZero(message = "Giá xu không được âm")
    private Integer costCoins;

    private String assetValue;

    private String frameStyle;

    private String imageUrl;

    private Boolean active;

    private Integer displayOrder;
}
