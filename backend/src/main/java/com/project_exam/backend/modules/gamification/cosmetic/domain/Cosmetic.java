package com.project_exam.backend.modules.gamification.cosmetic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Đồ trang trí (khung avatar / huy hiệu) admin tạo, user đổi bằng xu.
 * assetValue tuỳ loại: FRAME = màu/gradient CSS cho vòng viền; BADGE = icon/emoji.
 */
@Entity
@Table(name = "cosmetics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cosmetic {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    /** FRAME: màu/gradient CSS (COLOR) hoặc tên preset hiệu ứng (EFFECT); BADGE: icon/emoji. */
    @Column(columnDefinition = "TEXT")
    private String assetValue;

    /** Chỉ cho FRAME: COLOR (gradient) | EFFECT (preset CSS) | IMAGE (overlay ảnh). Dùng String để tránh bẫy CHECK constraint. */
    @Column(length = 20)
    private String frameStyle;

    /** Cho FRAME kiểu IMAGE (hoặc BADGE ảnh sau này): URL ảnh PNG/GIF trong suốt. */
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
