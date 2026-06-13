package com.project_exam.backend.modules.gamification.quest.mapper;

import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import com.project_exam.backend.modules.gamification.quest.dto.QuestClaimResponse;
import com.project_exam.backend.modules.gamification.quest.dto.QuestResponse;
import com.project_exam.backend.modules.gamification.quest.dto.UserQuestResponse;
import org.springframework.stereotype.Component;

/** Mapper thuần: dựng DTO từ dữ liệu đã được service chuẩn bị sẵn. */
@Component
public class QuestMapper {

    /** Kết quả nhận xu của 1 nhiệm vụ. */
    public QuestClaimResponse toClaimResponse(String questId, int rewardCoins, int newBalance) {
        return QuestClaimResponse.builder()
                .questId(questId)
                .rewardCoins(rewardCoins)
                .newBalance(newBalance)
                .build();
    }

    /**
     * Nhiệm vụ hiển thị cho user. Service truyền sẵn tiến độ (current/target),
     * cờ claimed và eligible đã tính toán.
     */
    public UserQuestResponse toUserResponse(Quest quest, int currentProgress, int target,
                                            boolean claimed, boolean eligible) {
        return UserQuestResponse.builder()
                .questId(quest.getQuestId())
                .title(quest.getTitle())
                .description(quest.getDescription())
                .rewardCoins(quest.getRewardCoins())
                .conditionType(quest.getConditionType())
                .conditionLabel(quest.getConditionType().getLabel())
                .currentProgress(currentProgress)
                .target(target)
                .claimed(claimed)
                .eligible(eligible)
                .endAt(quest.getEndAt())
                .build();
    }

    /** Nhiệm vụ hiển thị cho admin. Service truyền sẵn claimCount. */
    public QuestResponse toAdminResponse(Quest quest, long claimCount) {
        return QuestResponse.builder()
                .questId(quest.getQuestId())
                .title(quest.getTitle())
                .description(quest.getDescription())
                .rewardCoins(quest.getRewardCoins())
                .conditionType(quest.getConditionType())
                .conditionLabel(quest.getConditionType() == null
                        ? null : quest.getConditionType().getLabel())
                .conditionTarget(quest.getConditionTarget())
                .startAt(quest.getStartAt())
                .endAt(quest.getEndAt())
                .active(quest.getActive())
                .createdAt(quest.getCreatedAt())
                .claimCount(claimCount)
                .build();
    }
}
