package com.project_exam.backend.modules.gamification.streak.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_streaks", indexes = {
        @Index(name = "idx_user_streaks_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStreak {
    @Id
    @UuidV7
    private String userStreakId;

    @Column(nullable = false, unique = true)
    private String userId; // 1 record / user

    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Column(nullable = false)
    private Integer longestStreak = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate; // ngày học gần nhất (theo VN zone)

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
