package com.project_exam.backend.modules.gamification.coin.service;

import com.project_exam.backend.modules.gamification.coin.domain.UserCoin;
import com.project_exam.backend.modules.gamification.coin.dto.CoinResponse;
import com.project_exam.backend.modules.gamification.coin.dto.CoinWalletResponse;
import com.project_exam.backend.modules.gamification.coin.repository.UserCoinRepository;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.repository.UserRepository;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class CoinService {

    private final UserCoinRepository userCoinRepository;
    private final UserRepository userRepository;

    /**
     * Cộng xu vào ví của user (tạo ví nếu chưa có). Trả về số dư mới.
     * Dùng cho các nguồn "kiếm xu" (nhận nhiệm vụ...).
     */
    @Transactional
    public int addCoins(String userId, int amount) {
        UserCoin wallet = userCoinRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserCoin w = new UserCoin();
                    w.setUserId(userId);
                    w.setBalance(0);
                    return w;
                });
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        return userCoinRepository.save(wallet).getBalance();
    }

    /** Số dư xu của user đang đăng nhập — chưa có ví thì coi như 0. */
    @Transactional(readOnly = true)
    public CoinResponse getMyBalance(String userId) {
        int balance = userCoinRepository.findByUserId(userId)
                .map(UserCoin::getBalance)
                .orElse(0);
        return CoinResponse.builder().userId(userId).balance(balance).build();
    }

    /** Danh sách ví xu kèm thông tin user — cho trang quản lý admin. */
    @Transactional(readOnly = true)
    public List<CoinWalletResponse> findAllWallets() {
        List<UserCoin> wallets = userCoinRepository.findAll();
        if (wallets.isEmpty()) {
            return List.of();
        }

        Map<String, User> userById = userRepository
                .findAllById(wallets.stream().map(UserCoin::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        return wallets.stream()
                .map(wallet -> toWalletResponse(wallet, userById.get(wallet.getUserId())))
                .toList();
    }

    /** Tạo ví xu cho 1 user (admin). */
    @Transactional
    public CoinWalletResponse create(String userId, Integer balance) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User không tồn tại"));
        if (userCoinRepository.existsByUserId(userId)) {
            throw new ConflictException("User này đã có ví xu");
        }

        UserCoin wallet = new UserCoin();
        wallet.setUserId(userId);
        wallet.setBalance(balance);
        wallet.setUpdatedAt(LocalDateTime.now());
        wallet = userCoinRepository.save(wallet);
        return toWalletResponse(wallet, user);
    }

    /** Đặt lại số dư xu của 1 user (admin). */
    @Transactional
    public CoinWalletResponse updateBalance(String userId, Integer balance) {
        UserCoin wallet = userCoinRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("User này chưa có ví xu"));
        wallet.setBalance(balance);
        wallet.setUpdatedAt(LocalDateTime.now());
        wallet = userCoinRepository.save(wallet);
        return toWalletResponse(wallet, userRepository.findById(userId).orElse(null));
    }

    /** Xoá ví xu của 1 user (admin). */
    @Transactional
    public void delete(String userId) {
        UserCoin wallet = userCoinRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("User này chưa có ví xu"));
        userCoinRepository.delete(wallet);
    }

    private CoinWalletResponse toWalletResponse(UserCoin wallet, User user) {
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
