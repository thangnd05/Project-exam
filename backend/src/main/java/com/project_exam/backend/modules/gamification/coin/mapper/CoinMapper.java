package com.project_exam.backend.modules.gamification.coin.mapper;

import com.project_exam.backend.modules.gamification.coin.domain.UserCoin;
import com.project_exam.backend.modules.gamification.coin.dto.CoinResponse;
import com.project_exam.backend.modules.gamification.coin.dto.CoinWalletResponse;
import com.project_exam.backend.modules.users.user.domain.User;
import org.springframework.stereotype.Component;

/** Mapper thuần: dựng DTO từ dữ liệu đã được service chuẩn bị sẵn. */
@Component
public class CoinMapper {

    /** Số dư xu của 1 user. */
    public CoinResponse toBalanceResponse(String userId, int balance) {
        return CoinResponse.builder()
                .userId(userId)
                .balance(balance)
                .build();
    }

    /** Ví xu kèm thông tin user (user có thể null). */
    public CoinWalletResponse toWalletResponse(UserCoin wallet, User user) {
        return CoinWalletResponse.builder()
                .userCoinId(wallet.getUserCoinId())
                .userId(wallet.getUserId())
                .userName(user != null ? user.getUserName() : null)
                .fullName(user != null ? user.getFullName() : null)
                .email(user != null ? user.getEmail() : null)
                .balance(wallet.getBalance())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
