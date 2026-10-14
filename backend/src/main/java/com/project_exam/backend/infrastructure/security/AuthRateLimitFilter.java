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

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    // Quá số key này thì dọn các IP đã hết cửa sổ; nếu vẫn quá (bị dội từ rất nhiều IP) thì xoá hết
    // để RAM không tăng mãi, giống VisitRateLimiter.
    private static final int MAX_KEYS = 50_000;

    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/auth/login", 10,
            "/api/auth/register", 5,
            "/api/auth/forgot-password", 3,
            "/api/auth/reset-password", 5,
            "/api/auth/reset-password/check", 20,
            "/api/auth/change-password", 5,
            "/api/auth/refresh", 30,
            // Khách tạo lượt thi không cần đăng nhập, đổi X-Guest-Session là ra dòng mới trong DB.
            // Đặt rộng vì cả lớp học / quán net có thể dùng chung một IP.
            "/api/user-tests/guest", 30
            // [TẮT XÁC THỰC EMAIL] , "/api/auth/verify", 10
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

        if (hits.size() > MAX_KEYS) {
            evictStale(now);
        }

        Deque<Long> dq = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (dq) {

            while (!dq.isEmpty() && (now - dq.peekFirst()) > WINDOW_MS) {
                dq.pollFirst();
            }
            if (dq.size() >= limit) {
                long retryAfterSec = Math.max(1, (WINDOW_MS - (now - dq.peekFirst())) / 1000);
                response.setStatus(429);
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

    private void evictStale(long now) {
        hits.entrySet().removeIf(entry -> {
            Deque<Long> dq = entry.getValue();
            synchronized (dq) {
                return dq.isEmpty() || (now - dq.peekLast()) > WINDOW_MS;
            }
        });
        if (hits.size() > MAX_KEYS) {
            hits.clear();
        }
    }

    private String clientIp(HttpServletRequest request) {

        String ip = request.getRemoteAddr();
        return ip == null ? "unknown" : ip;
    }
}
