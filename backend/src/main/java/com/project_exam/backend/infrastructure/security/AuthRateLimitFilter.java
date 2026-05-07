package com.project_exam.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate-limit cho các endpoint nhạy cảm (auth) để chống brute-force / DoS.
 * Sliding window 60s, key = (clientIp, path). In-memory, đủ cho single-node;
 * scale ngang phải chuyển sang Redis.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    /** Mỗi path có giới hạn riêng. Path không có trong map → không rate-limit. */
    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/auth/login", 10,
            "/api/auth/register", 5,
            "/api/auth/forgot-password", 3,
            "/api/auth/reset-password", 5,
            "/api/auth/change-password", 5,
            "/api/auth/refresh", 30,
            "/api/auth/verify", 10
    );

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        Integer limit = LIMITS.get(path);
        if (limit == null) {
            chain.doFilter(request, response);
            return;
        }

        String ip = clientIp(request);
        String key = ip + "|" + path;
        long now = System.currentTimeMillis();

        Deque<Long> dq = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (dq) {
            // bỏ các hit cũ hơn 60s
            while (!dq.isEmpty() && (now - dq.peekFirst()) > WINDOW_MS) {
                dq.pollFirst();
            }
            if (dq.size() >= limit) {
                long retryAfterSec = Math.max(1, (WINDOW_MS - (now - dq.peekFirst())) / 1000);
                response.setStatus(429); // Too Many Requests
                response.setHeader("Retry-After", String.valueOf(retryAfterSec));
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau "
                                + retryAfterSec + " giây.\"}"
                );
                return;
            }
            dq.addLast(now);
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Lấy IP đầu tiên trong chuỗi (client gốc)
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }
}
