package com.project_exam.backend.modules.gamification.coin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** 1 dòng ví xu kèm thông tin user — dùng cho bảng quản lý ở admin. */
@Getter
@Builder
public class CoinWalletResponse {
    private String userCoinId;
    private String userId;
    private String userName;
    private String fullName;
    private String email;
    private Integer balance;
    private Instant updatedAt;
}
