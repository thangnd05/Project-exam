package com.project_exam.backend.modules.gamification.streak.service;

import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import com.project_exam.backend.modules.gamification.streak.mapper.StreakMapper;
import com.project_exam.backend.modules.gamification.streak.repository.UserStreakRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class StreakService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserStreakRepository userStreakRepository;
    private final StreakRecoverConfigService recoverConfigService;
    private final CoinService coinService;
    private final StreakMapper streakMapper;

    /**
     * Ghi nhận 1 hoạt động học cho user và cập nhật chuỗi ngày.
     *
     * Chạy trong transaction RIÊNG (REQUIRES_NEW) để side-effect streak không làm
     * rollback luồng chính (nộp bài, luyện từ...). Người gọi nên bọc try/catch.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StreakResponse recordActivity(String userId, StreakActivityType type) {
        if (type == null || !type.isEnabled() || userId == null || userId.isBlank()) {
            return null; // loại này không tính streak, hoặc là guest -> bỏ qua
        }

        LocalDate today = LocalDate.now(VN);

        // Khóa ghi (PESSIMISTIC_WRITE) để 2 hoạt động gần nhau không cùng đọc-sửa-ghi -> lost update.
        UserStreak streak = userStreakRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    UserStreak s = new UserStreak();
                    s.setUserId(userId);
                    s.setCurrentStreak(0);
                    s.setLongestStreak(0);
                    return s;
                });

        LocalDate last = streak.getLastActivityDate();
        boolean increased;

        if (today.equals(last)) {
            // Đã tính trong ngày -> không đổi.
            increased = false;
        } else {
            if (last != null && last.equals(today.minusDays(1))) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1); // +1 nối tiếp
            } else {
                streak.setCurrentStreak(1); // lần đầu hoặc đứt chuỗi -> đếm lại từ 1
            }
            streak.setLongestStreak(Math.max(streak.getLongestStreak(), streak.getCurrentStreak()));
            streak.setLastActivityDate(today);
            streak.setUpdatedAt(LocalDateTime.now());
            userStreakRepository.save(streak);
            increased = true;
        }

        return buildResponse(streak, today, increased);
    }

    /**
     * Đọc streak để hiển thị. Nếu hoạt động gần nhất cũ hơn hôm qua thì chuỗi đã đứt
     * -> hiển thị currentStreak = 0 (không ghi DB, longestStreak giữ nguyên), đồng thời
     * báo về số ngày vừa mất + có khôi phục được không.
     */
    @Transactional(readOnly = true)
    public StreakResponse getStreak(String userId) {
        UserStreak streak = userStreakRepository.findByUserId(userId).orElse(null);
        LocalDate today = LocalDate.now(VN);
        if (streak == null) {
            StreakRecoverConfigResponse cfg = recoverConfigService.get();
            return streakMapper.toEmptyResponse(cfg.getCostCoins());
        }
        return buildResponse(streak, today, false);
    }

    /**
     * Khôi phục chuỗi đã đứt: trừ xu rồi nối lại chuỗi về đúng số đã mất.
     * Điều kiện: chuỗi đã đứt, user CHƯA học lại (currentStreak cũ còn nguyên), tính năng đang bật.
     */
    @Transactional
    public StreakResponse restore(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Phiên đăng nhập không hợp lệ");
        }

        UserStreak streak = userStreakRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa có chuỗi nào để khôi phục"));

        LocalDate today = LocalDate.now(VN);
        LocalDate last = streak.getLastActivityDate();
        boolean broken = last != null && last.isBefore(today.minusDays(1));
        int lost = streak.getCurrentStreak();
        if (!broken || lost <= 0) {
            throw new BadRequestException("Chuỗi của bạn không thể khôi phục");
        }

        StreakRecoverConfigResponse cfg = recoverConfigService.get();
        if (!Boolean.TRUE.equals(cfg.getActive())) {
            throw new BadRequestException("Tính năng khôi phục chuỗi đang tắt");
        }

        coinService.spend(userId, cfg.getCostCoins()); // ném lỗi nếu không đủ xu

        // Nối lại: coi như đã học tới hôm qua -> chuỗi 'lost' sống lại, hôm nay học tiếp sẽ +1.
        streak.setLastActivityDate(today.minusDays(1));
        streak.setUpdatedAt(LocalDateTime.now());
        userStreakRepository.save(streak);

        return buildResponse(streak, today, false);
    }

    private StreakResponse buildResponse(UserStreak streak, LocalDate today, boolean increased) {
        LocalDate last = streak.getLastActivityDate();
        boolean broken = last != null && last.isBefore(today.minusDays(1));
        int stored = streak.getCurrentStreak();
        int effectiveCurrent = broken ? 0 : stored;
        int lost = (broken && stored > 0) ? stored : 0;

        StreakRecoverConfigResponse cfg = recoverConfigService.get();
        boolean canRecover = lost > 0 && Boolean.TRUE.equals(cfg.getActive());

        return streakMapper.toResponse(
                streak, effectiveCurrent, increased, lost, canRecover, cfg.getCostCoins());
    }
}
