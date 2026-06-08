package com.project_exam.backend.modules.gamification.coin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

/** Tạo ví xu cho 1 user (admin chọn user + số dư khởi tạo). */
@Data
public class CoinUpsertRequest {
    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotNull(message = "Số xu không được để trống")
    @PositiveOrZero(message = "Số xu không được âm")
    private Integer balance;
}
