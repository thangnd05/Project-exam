package com.project_exam.backend.modules.gamification.streak.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StreakRecoverConfigResponse {
    private Integer costCoins;
    private Boolean active;
}
