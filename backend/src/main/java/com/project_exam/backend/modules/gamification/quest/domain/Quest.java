package com.project_exam.backend.modules.gamification.quest.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

/**
 * Định nghĩa 1 nhiệm vụ (admin tạo). Người dùng nhận xu 1 lần / nhiệm vụ.
 * startAt/endAt = khoảng thời gian hiệu lực (null = vô hạn) — hết hạn thì ẩn khỏi user.
 */
@Entity
@Table(name = "quests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quest {
    @Id
    @UuidV7
    private String questId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer rewardCoins = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestConditionType conditionType = QuestConditionType.NONE;

    /** Số lần cần đạt cho điều kiện (vd hoàn thành >= 3 bài). NONE thì bỏ qua. */
    @Column(nullable = false)
    private Integer conditionTarget = 1;

    private Instant startAt; // null = không giới hạn bắt đầu
    private Instant endAt;   // null = không giới hạn kết thúc

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
