package com.project_exam.backend.modules.analytics.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class VisitRateLimiter {

    private static final int MAX_PER_MINUTE = 120;
    private static final int MAX_KEYS = 50_000;

    private record Window(long minute, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean allow(String key) {
        String safeKey = (key == null || key.isBlank()) ? "unknown" : key;
        long minute = System.currentTimeMillis() / 60_000L;

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
