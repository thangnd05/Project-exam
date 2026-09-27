package com.project_exam.backend.modules.system.analytics.service;

import com.project_exam.backend.modules.system.analytics.domain.PageVisit;
import com.project_exam.backend.modules.system.analytics.repository.PageVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class VisitTrackingService {

    private static final int MAX_PATH_LENGTH = 255;

    // Khớp với SESSION_GAP_MS ở FE (VisitTracker): trong khoảng này cùng session_key không tính thêm lượt.
    private static final Duration SESSION_GAP = Duration.ofMinutes(30);

    private final PageVisitRepository pageVisitRepository;
    private final GeoIpService geoIpService;

    @Async("visitExecutor")
    public void record(String path, String sessionKey, String userId, String ipAddress) {
        if (!StringUtils.hasText(path)) {
            return;
        }
        String key = trim(sessionKey, 64);
        if (StringUtils.hasText(key)
                && pageVisitRepository.existsBySessionKeyAndCreatedAtAfter(key, Instant.now().minus(SESSION_GAP))) {
            return;
        }
        GeoIpService.Country country = geoIpService.resolve(ipAddress);
        pageVisitRepository.save(PageVisit.builder()
                .path(trim(path, MAX_PATH_LENGTH))
                .sessionKey(key)
                .userId(userId)
                .ipAddress(trim(ipAddress, 45))
                .countryCode(country.code())
                .country(trim(country.name(), 100))
                .createdAt(Instant.now())
                .build());
    }

    @Transactional
    public int purgeOlderThan(int days) {
        return pageVisitRepository.deleteOlderThan(Instant.now().minus(Duration.ofDays(days)));
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
