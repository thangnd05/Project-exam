package com.project_exam.backend.modules.gamification.streak.service;

import com.project_exam.backend.modules.gamification.streak.domain.StreakRecoverConfig;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigRequest;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.repository.StreakRecoverConfigRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Quản lý cấu hình khôi phục chuỗi (giá xu + bật/tắt). Chỉ giữ 1 dòng cấu hình;
 * nếu chưa có thì coi như mặc định (50 xu, đang bật).
 */
@Service
@AllArgsConstructor
public class StreakRecoverConfigService {

    private static final int DEFAULT_COST = 50;

    private final StreakRecoverConfigRepository configRepository;

    /** Đọc cấu hình hiện tại (không ghi DB) — trả mặc định nếu chưa có dòng nào. */
    @Transactional(readOnly = true)
    public StreakRecoverConfigResponse get() {
        return configRepository.findAll().stream().findFirst()
                .map(c -> StreakRecoverConfigResponse.builder()
                        .costCoins(c.getCostCoins())
                        .active(Boolean.TRUE.equals(c.getActive()))
                        .build())
                .orElse(StreakRecoverConfigResponse.builder()
                        .costCoins(DEFAULT_COST)
                        .active(true)
                        .build());
    }

    /** Cập nhật giá / bật-tắt (admin). Tạo dòng cấu hình nếu chưa có. */
    @Transactional
    public StreakRecoverConfigResponse update(StreakRecoverConfigRequest request) {
        StreakRecoverConfig config = configRepository.findAll().stream().findFirst()
                .orElseGet(StreakRecoverConfig::new);
        config.setCostCoins(request.getCostCoins());
        config.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());
        config.setUpdatedAt(LocalDateTime.now());
        StreakRecoverConfig saved = configRepository.save(config);
        return StreakRecoverConfigResponse.builder()
                .costCoins(saved.getCostCoins())
                .active(saved.getActive())
                .build();
    }
}
