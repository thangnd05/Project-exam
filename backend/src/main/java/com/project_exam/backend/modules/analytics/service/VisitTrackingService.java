package com.project_exam.backend.modules.analytics.service;

import com.project_exam.backend.modules.analytics.domain.PageVisit;
import com.project_exam.backend.modules.analytics.repository.PageVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VisitTrackingService {

    private static final int MAX_PATH_LENGTH = 255;

    private final PageVisitRepository pageVisitRepository;
    private final GeoIpService geoIpService;

    /**
     * Ghi nhận 1 lượt xem trang. Bỏ qua nếu path rỗng; cắt bớt các trường quá dài.
     *
     * <p>Chạy bất đồng bộ trên {@code visitExecutor}: phần tra geo-IP có thể gọi mạng nên không
     * để chặn thread xử lý request (FE vốn fire-and-forget, không chờ kết quả).
     */
    @Async("visitExecutor")
    public void record(String path, String sessionKey, String userId, String ipAddress) {
        if (!StringUtils.hasText(path)) {
            return;
        }
        GeoIpService.Country country = geoIpService.resolve(ipAddress);
        pageVisitRepository.save(PageVisit.builder()
                .path(trim(path, MAX_PATH_LENGTH))
                .sessionKey(trim(sessionKey, 64))
                .userId(userId)
                .ipAddress(trim(ipAddress, 45))
                .countryCode(country.code())
                .country(trim(country.name(), 100))
                .createdAt(LocalDateTime.now())
                .build());
    }

    /** Xoá các lượt xem cũ hơn {@code days} ngày (retention) — tránh bảng page_visits phình vô hạn. */
    @Transactional
    public int purgeOlderThan(int days) {
        return pageVisitRepository.deleteOlderThan(LocalDateTime.now().minusDays(days));
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
