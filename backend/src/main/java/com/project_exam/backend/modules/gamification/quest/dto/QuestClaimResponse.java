package com.project_exam.backend.modules.gamification.quest.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestClaimResponse {
    private String questId;
    private Integer rewardCoins;
    private Integer newBalance;
}
