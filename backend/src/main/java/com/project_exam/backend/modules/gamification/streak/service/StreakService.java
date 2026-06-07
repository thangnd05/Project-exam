package com.project_exam.backend.modules.gamification.streak.service;

import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import com.project_exam.backend.modules.gamification.streak.repository.UserStreakRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@AllArgsConstructor
public class StreakService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserStreakRepository userStreakRepository;

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

        UserStreak streak = userStreakRepository.findByUserId(userId)
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

        return toResponse(streak, increased);
    }

    /**
     * Đọc streak để hiển thị. Nếu hoạt động gần nhất cũ hơn hôm qua thì chuỗi đã đứt
     * -> hiển thị currentStreak = 0 (không ghi DB, longestStreak giữ nguyên).
     */
    @Transactional(readOnly = true)
    public StreakResponse getStreak(String userId) {
        UserStreak streak = userStreakRepository.findByUserId(userId).orElse(null);
        if (streak == null) {
            return StreakResponse.builder()
                    .currentStreak(0)
                    .longestStreak(0)
                    .lastActivityDate(null)
                    .increased(false)
                    .build();
        }

        LocalDate today = LocalDate.now(VN);
        LocalDate last = streak.getLastActivityDate();
        int effectiveCurrent = streak.getCurrentStreak();
        if (last == null || last.isBefore(today.minusDays(1))) {
            effectiveCurrent = 0; // chuỗi đã đứt
        }

        return StreakResponse.builder()
                .currentStreak(effectiveCurrent)
                .longestStreak(streak.getLongestStreak())
                .lastActivityDate(last)
                .increased(false)
                .build();
    }

    private StreakResponse toResponse(UserStreak streak, boolean increased) {
        return StreakResponse.builder()
                .currentStreak(streak.getCurrentStreak())
                .longestStreak(streak.getLongestStreak())
                .lastActivityDate(streak.getLastActivityDate())
                .increased(increased)
                .build();
    }
}
