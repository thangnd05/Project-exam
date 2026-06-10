package com.project_exam.backend.modules.gamification.streak.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StreakRecoverConfigRequest {
    @NotNull(message = "Giá xu không được để trống")
    @Min(value = 0, message = "Giá xu phải là số không âm")
    private Integer costCoins;

    private Boolean active;
}
