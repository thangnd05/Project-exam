package com.project_exam.backend.modules.gamification.coin.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Ví xu của user — 1 record / user, chỉ giữ số dư hiện tại.
 * Logic kiếm/tiêu xu (nhiệm vụ, đổi thưởng) sẽ làm sau, bảng này chỉ là nơi lưu số dư.
 */
@Entity
@Table(name = "user_coins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCoin {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userCoinId;

    @Column(nullable = false, unique = true)
    private String userId; // 1 record / user

    @Column(nullable = false)
    private Integer balance = 0;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
