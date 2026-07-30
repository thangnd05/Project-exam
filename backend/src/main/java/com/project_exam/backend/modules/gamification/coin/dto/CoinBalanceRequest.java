package com.project_exam.backend.modules.gamification.coin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class CoinBalanceRequest {
    @NotNull(message = "Số xu không được để trống")
    @PositiveOrZero(message = "Số xu không được âm")
    private Integer balance;
}
