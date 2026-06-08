package com.project_exam.backend.modules.gamification.coin.dto;

import lombok.Builder;
import lombok.Getter;

/** Số dư xu của user đang đăng nhập (dùng cho header). */
@Getter
@Builder
public class CoinResponse {
    private String userId;
    private Integer balance;
}
