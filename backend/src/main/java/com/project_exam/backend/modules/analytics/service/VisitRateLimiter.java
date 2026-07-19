package com.project_exam.backend.modules.analytics.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate-limit đơn giản cho endpoint ghi lượt truy cập (public, không auth) — chặn spam thổi phồng
 * số liệu. Cửa sổ cố định 1 phút, mỗi khoá tối đa {@value #MAX_PER_MINUTE} lượt.
 *
 * <p>In-memory, best-effort: khoá spoof được (IP qua X-Forwarded-For, sessionKey do client đặt)
 * nên chỉ nâng rào chống spam thô; chống triệt để cần proxy tin cậy + rate-limiter hạ tầng.
 * Map được chặn trần {@value #MAX_KEYS} khoá để không phình RAM.
 */
@Component
public class VisitRateLimiter {

    private static final int MAX_PER_MINUTE = 120;
    private static final int MAX_KEYS = 50_000;

    private record Window(long minute, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** true nếu khoá còn quota trong phút hiện tại; false nếu đã vượt ngưỡng. */
    public boolean allow(String key) {
        String safeKey = (key == null || key.isBlank()) ? "unknown" : key;
        long minute = System.currentTimeMillis() / 60_000L;

        // Quá tải (nhiều khoá lạ) -> reset thô để giải phóng RAM; chấp nhận nới quota tạm thời.
        if (windows.size() > MAX_KEYS) {
            windows.clear();
        }

        Window updated = windows.compute(safeKey, (k, current) ->
                (current == null || current.minute() != minute)
                        ? new Window(minute, 1)
                        : new Window(minute, current.count() + 1));

        return updated.count() <= MAX_PER_MINUTE;
    }
}
