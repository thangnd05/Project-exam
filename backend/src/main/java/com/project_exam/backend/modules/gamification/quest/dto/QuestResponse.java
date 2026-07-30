package com.project_exam.backend.modules.gamification.quest.dto;

import com.project_exam.backend.modules.gamification.quest.domain.QuestConditionType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class QuestResponse {
    private String questId;
    private String title;
    private String description;
    private Integer rewardCoins;
    private QuestConditionType conditionType;
    private String conditionLabel;
    private Integer conditionTarget;
    private Instant startAt;
    private Instant endAt;
    private Boolean active;
    private Instant createdAt;
    private Long claimCount;
}
