package com.project_exam.backend.modules.gamification.streak.service;

import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.dto.StreakLeaderboardResponse;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import com.project_exam.backend.modules.gamification.streak.mapper.StreakMapper;
import com.project_exam.backend.modules.gamification.streak.repository.UserStreakRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StreakService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int LEADERBOARD_TOP_LIMIT = 100;

    private final UserStreakRepository userStreakRepository;
    private final UserRepository userRepository;
    private final StreakRecoverConfigService recoverConfigService;
    private final CoinService coinService;
    private final StreakMapper streakMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StreakResponse recordActivity(String userId, StreakActivityType type) {
        if (type == null || !type.isEnabled() || userId == null || userId.isBlank()) {
            return null;
        }

        LocalDate today = LocalDate.now(VN);

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

            increased = false;
        } else {
            if (last != null && last.equals(today.minusDays(1))) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            } else {
                streak.setCurrentStreak(1);
            }
            streak.setLongestStreak(Math.max(streak.getLongestStreak(), streak.getCurrentStreak()));
            streak.setLastActivityDate(today);
            streak.setUpdatedAt(Instant.now());
            userStreakRepository.save(streak);
            increased = true;
        }

        return buildResponse(streak, today, increased);
    }

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

        coinService.spend(userId, cfg.getCostCoins());

        streak.setLastActivityDate(today.minusDays(1));
        streak.setUpdatedAt(Instant.now());
        userStreakRepository.save(streak);

        return buildResponse(streak, today, false);
    }

    @Transactional(readOnly = true)
    public StreakLeaderboardResponse getLeaderboard(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), LEADERBOARD_TOP_LIMIT);
        List<UserStreak> ranked = userStreakRepository.findRankedByLongestStreak(PageRequest.of(0, safeLimit));

        Set<String> userIds = ranked.stream()
                .map(UserStreak::getUserId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        Map<String, User> usersById = userIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, user -> user));

        List<StreakLeaderboardResponse.Entry> entries = new ArrayList<>();
        for (int i = 0; i < ranked.size(); i++) {
            UserStreak streak = ranked.get(i);
            User user = streak.getUserId() == null ? null : usersById.get(streak.getUserId());
            int longest = streak.getLongestStreak() == null ? 0 : streak.getLongestStreak();
            entries.add(StreakLeaderboardResponse.Entry.builder()
                    .rank(i + 1)
                    .displayName(displayName(user))
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .longestStreak(longest)
                    .build());
        }

        long total = userStreakRepository.countByLongestStreakGreaterThan(0);
        int totalParticipants = total > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) total;
        return StreakLeaderboardResponse.builder()
                .entries(entries)
                .totalParticipants(totalParticipants)
                .build();
    }

    private String displayName(User user) {
        if (user == null) {
            return "Người dùng";
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        if (user.getUserName() != null && !user.getUserName().isBlank()) {
            return user.getUserName().trim();
        }
        return "Người dùng";
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
