package com.project_exam.backend.modules.gamification.quest.dto;

import lombok.Builder;
import lombok.Getter;

/** Kết quả khi user nhận xu của 1 nhiệm vụ. */
@Getter
@Builder
public class QuestClaimResponse {
    private String questId;
    private Integer rewardCoins; // số xu vừa nhận
    private Integer newBalance;  // số dư ví sau khi nhận
}
