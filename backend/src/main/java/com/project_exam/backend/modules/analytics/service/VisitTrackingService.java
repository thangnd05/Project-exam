package com.project_exam.backend.modules.analytics.service;

import com.project_exam.backend.modules.analytics.domain.PageVisit;
import com.project_exam.backend.modules.analytics.repository.PageVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VisitTrackingService {

    private static final int MAX_PATH_LENGTH = 255;

    private final PageVisitRepository pageVisitRepository;
    private final GeoIpService geoIpService;

    /** Ghi nhận 1 lượt xem trang. Bỏ qua nếu path rỗng; cắt bớt các trường quá dài. */
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

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
