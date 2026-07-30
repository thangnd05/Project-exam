package com.project_exam.backend.modules.gamification.coin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CoinResponse {
    private String userId;
    private Integer balance;
}
