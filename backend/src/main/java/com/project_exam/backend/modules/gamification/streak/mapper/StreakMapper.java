package com.project_exam.backend.modules.gamification.streak.mapper;

import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import org.springframework.stereotype.Component;

@Component
public class StreakMapper {

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

    public StreakRecoverConfigResponse toConfigResponse(Integer costCoins, Boolean active) {
        return StreakRecoverConfigResponse.builder()
                .costCoins(costCoins)
                .active(active)
                .build();
    }
}
