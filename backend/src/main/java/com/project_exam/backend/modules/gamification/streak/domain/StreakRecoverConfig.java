package com.project_exam.backend.modules.gamification.streak.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "streak_recover_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StreakRecoverConfig {
    @Id
    @UuidV7
    private String id;

    @Column(nullable = false)
    private Integer costCoins = 50;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
