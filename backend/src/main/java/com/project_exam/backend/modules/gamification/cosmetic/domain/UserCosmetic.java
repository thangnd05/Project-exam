package com.project_exam.backend.modules.gamification.cosmetic.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.LocalDateTime;

/** Đồ trang trí user đã sở hữu. equipped = đang đeo (mỗi loại tối đa 1 cái equipped). */
@Entity
@Table(
        name = "user_cosmetics",
        uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "cosmeticId"}),
        indexes = {
                @Index(name = "idx_user_cosmetics_cosmetic_id", columnList = "cosmetic_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCosmetic {
    @Id
    @UuidV7
    private String userCosmeticId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String cosmeticId;

    @Column(nullable = false)
    private Boolean equipped = false;

    @Column(nullable = false)
    private LocalDateTime ownedAt = LocalDateTime.now();
}
