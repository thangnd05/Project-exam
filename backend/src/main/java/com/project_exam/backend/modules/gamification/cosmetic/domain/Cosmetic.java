package com.project_exam.backend.modules.gamification.cosmetic.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "cosmetics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cosmetic {
    @Id
    @UuidV7
    private String cosmeticId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CosmeticType type;

    @Column(nullable = false)
    private Integer costCoins = 0;

    @Column(columnDefinition = "TEXT")
    private String assetValue;

    @Column(length = 20)
    private String frameStyle;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
