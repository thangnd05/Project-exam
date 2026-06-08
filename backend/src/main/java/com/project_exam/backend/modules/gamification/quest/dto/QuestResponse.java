package com.project_exam.backend.modules.gamification.quest.dto;

import com.project_exam.backend.modules.gamification.quest.domain.QuestConditionType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/** Nhiệm vụ đầy đủ — dùng cho trang quản lý admin. */
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
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Boolean active;
    private LocalDateTime createdAt;
    private Long claimCount; // số user đã nhận
}
