package com.project_exam.backend.modules.gamification.coin.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_coins", indexes = {
        @Index(name = "idx_user_coins_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCoin {
    @Id
    @UuidV7
    private String userCoinId;

    @Column(nullable = false, unique = true)
    private String userId;

    @Column(nullable = false)
    private Integer balance = 0;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
