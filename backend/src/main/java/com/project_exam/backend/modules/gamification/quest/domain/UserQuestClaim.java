package com.project_exam.backend.modules.gamification.quest.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

/**
 * Ghi nhận 1 user đã nhận xu của 1 nhiệm vụ. UNIQUE(userId, questId) -> nhận 1 lần.
 * Giữ lại làm lịch sử kể cả khi nhiệm vụ đã hết hạn.
 */
@Entity
@Table(
        name = "user_quest_claims",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "quest_id"}),
        indexes = {
                @Index(name = "idx_user_quest_claims_quest_id", columnList = "quest_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserQuestClaim {
    @Id
    @UuidV7
    private String userQuestClaimId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String questId;

    /** Snapshot số xu đã thưởng (để xem lịch sử kể cả khi quest đổi reward). */
    @Column(nullable = false)
    private Integer rewardCoins;

    @Column(nullable = false)
    private Instant claimedAt = Instant.now();
}
