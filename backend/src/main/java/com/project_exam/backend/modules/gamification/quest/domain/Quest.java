package com.project_exam.backend.modules.gamification.quest.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

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

    @Column(nullable = false)
    private Integer conditionTarget = 1;

    private Instant startAt;
    private Instant endAt;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
