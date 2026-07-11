package com.project_exam.backend.modules.gamification.coin.service;

import com.project_exam.backend.modules.gamification.coin.domain.UserCoin;
import com.project_exam.backend.modules.gamification.coin.dto.CoinResponse;
import com.project_exam.backend.modules.gamification.coin.dto.CoinWalletResponse;
import com.project_exam.backend.modules.gamification.coin.mapper.CoinMapper;
import com.project_exam.backend.modules.gamification.coin.repository.UserCoinRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoinService {

    private final UserCoinRepository userCoinRepository;
    private final UserRepository userRepository;
    private final CoinMapper coinMapper;

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

    /**
     * Trừ xu khi user đổi/mua (cosmetic, mở khóa...). Trả số dư mới.
     * Ném lỗi nếu không đủ xu. Chạy trong transaction để đọc-kiểm-ghi an toàn.
     */
    @Transactional
    public int spend(String userId, int amount) {
        if (amount <= 0) {
            throw new BadRequestException("Số xu cần trừ phải lớn hơn 0");
        }
        // Trừ nguyên tử ở mức DB: chỉ trừ khi balance >= amount. 0 dòng update
        // = không đủ xu (hoặc chưa có ví). Chống double-spend khi request đồng thời.
        int updated = userCoinRepository.deduct(userId, amount);
        if (updated == 0) {
            throw new BadRequestException(
                    userCoinRepository.existsByUserId(userId) ? "Bạn không đủ xu" : "Bạn chưa có xu nào");
        }
        return userCoinRepository.findByUserId(userId)
                .map(UserCoin::getBalance)
                .orElse(0);
    }

    /** Số dư xu của user đang đăng nhập — chưa có ví thì coi như 0. */
    @Transactional(readOnly = true)
    public CoinResponse getMyBalance(String userId) {
        int balance = userCoinRepository.findByUserId(userId)
                .map(UserCoin::getBalance)
                .orElse(0);
        return coinMapper.toBalanceResponse(userId, balance);
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
                .map(wallet -> coinMapper.toWalletResponse(wallet, userById.get(wallet.getUserId())))
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
        return coinMapper.toWalletResponse(wallet, user);
    }

    /** Đặt lại số dư xu của 1 user (admin). */
    @Transactional
    public CoinWalletResponse updateBalance(String userId, Integer balance) {
        UserCoin wallet = userCoinRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("User này chưa có ví xu"));
        wallet.setBalance(balance);
        wallet.setUpdatedAt(LocalDateTime.now());
        wallet = userCoinRepository.save(wallet);
        return coinMapper.toWalletResponse(wallet, userRepository.findById(userId).orElse(null));
    }

    /** Xoá ví xu của 1 user (admin). */
    @Transactional
    public void delete(String userId) {
        UserCoin wallet = userCoinRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("User này chưa có ví xu"));
        userCoinRepository.delete(wallet);
    }
}
