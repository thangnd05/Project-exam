package com.project_exam.backend.modules.gamification.streak.mapper;

import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import org.springframework.stereotype.Component;


/** Mapper thuần: dựng DTO từ dữ liệu đã được service chuẩn bị sẵn. */
@Component
public class StreakMapper {

    /**
     * Streak hiệu lực. Service truyền sẵn các giá trị đã tính:
     * effectiveCurrent, lostStreak, canRecover, recoverCost.
     */
    public StreakResponse toResponse(UserStreak streak, int effectiveCurrent, boolean increased,
                                     int lostStreak, boolean canRecover, int recoverCost) {
        return StreakResponse.builder()
                .currentStreak(effectiveCurrent)
                .longestStreak(streak.getLongestStreak())
                .lastActivityDate(streak.getLastActivityDate())
                .increased(increased)
                .lostStreak(lostStreak)
                .canRecover(canRecover)
                .recoverCost(recoverCost)
                .build();
    }

    /** User chưa có chuỗi nào: tất cả về 0/false, chỉ recoverCost lấy từ config. */
    public StreakResponse toEmptyResponse(int recoverCost) {
        return StreakResponse.builder()
                .currentStreak(0)
                .longestStreak(0)
                .lastActivityDate(null)
                .increased(false)
                .lostStreak(0)
                .canRecover(false)
                .recoverCost(recoverCost)
                .build();
    }

    /** Cấu hình khôi phục chuỗi. Service truyền sẵn giá trị (đã chuẩn hoá / mặc định). */
    public StreakRecoverConfigResponse toConfigResponse(Integer costCoins, Boolean active) {
        return StreakRecoverConfigResponse.builder()
                .costCoins(costCoins)
                .active(active)
                .build();
    }
}
