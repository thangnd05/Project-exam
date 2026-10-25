package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Giới hạn theo tài khoản/email, bổ sung cho AuthRateLimitFilter (chỉ đếm theo IP):
 * kẻ tấn công đổi IP liên tục vẫn không dò mật khẩu hay dội mail reset vào một người được.
 * Đếm cả với email không tồn tại để 429 không làm lộ email nào có trong hệ thống.
 * Redis lỗi thì cho qua (vẫn còn giới hạn theo IP), giống PostViewThrottleService.
 */
@Service
@RequiredArgsConstructor
public class AuthAttemptLimiter {

    private static final Logger log = LoggerFactory.getLogger(AuthAttemptLimiter.class);

    private static final String LOGIN_FAIL_PREFIX = "auth:login-fail:";
    private static final int MAX_LOGIN_FAILURES = 10;
    private static final Duration LOGIN_FAIL_WINDOW = Duration.ofMinutes(15);

    private static final String RESET_COOLDOWN_PREFIX = "auth:reset-mail:cd:";
    private static final String RESET_HOURLY_PREFIX = "auth:reset-mail:h:";
    // Khớp RESEND_COOLDOWN_SECONDS ở FE (ForgotPassword).
    private static final Duration RESET_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_RESET_MAILS_PER_HOUR = 5;
    private static final Duration RESET_HOURLY_WINDOW = Duration.ofHours(1);

    private final StringRedisTemplate redis;

    public void checkLoginAllowed(String identifier) {
        String key = LOGIN_FAIL_PREFIX + hash(identifier);
        try {
            String value = redis.opsForValue().get(key);
            if (value != null && Long.parseLong(value) >= MAX_LOGIN_FAILURES) {
                long retryAfter = ttlSeconds(key, LOGIN_FAIL_WINDOW);
                throw new TooManyRequestsException(
                        "Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau "
                                + Math.max(1, (retryAfter + 59) / 60) + " phút.",
                        retryAfter);
            }
        } catch (DataAccessException ex) {
            log.warn("Redis lỗi khi kiểm tra giới hạn đăng nhập: {}", ex.getMessage());
        }
    }

    public void recordLoginFailure(String identifier) {
        try {
            incrementWithinWindow(LOGIN_FAIL_PREFIX + hash(identifier), LOGIN_FAIL_WINDOW);
        } catch (DataAccessException ex) {
            log.warn("Redis lỗi khi ghi lần đăng nhập sai: {}", ex.getMessage());
        }
    }

    public void resetLoginFailures(String identifier) {
        try {
            redis.delete(LOGIN_FAIL_PREFIX + hash(identifier));
        } catch (DataAccessException ex) {
            log.warn("Redis lỗi khi xoá bộ đếm đăng nhập sai: {}", ex.getMessage());
        }
    }

    public void acquireResetMailSlot(String email) {
        String hashed = hash(email);
        String cooldownKey = RESET_COOLDOWN_PREFIX + hashed;
        String hourlyKey = RESET_HOURLY_PREFIX + hashed;
        try {
            // Kiểm tra cooldown trước: request bị chặn vì cooldown không ăn vào hạn mức theo giờ.
            Boolean acquired = redis.opsForValue().setIfAbsent(cooldownKey, "1", RESET_COOLDOWN);
            if (!Boolean.TRUE.equals(acquired)) {
                long retryAfter = ttlSeconds(cooldownKey, RESET_COOLDOWN);
                throw new TooManyRequestsException(
                        "Vui lòng đợi " + retryAfter + " giây trước khi gửi lại email đặt lại mật khẩu.",
                        retryAfter);
            }
            if (incrementWithinWindow(hourlyKey, RESET_HOURLY_WINDOW) > MAX_RESET_MAILS_PER_HOUR) {
                long retryAfter = ttlSeconds(hourlyKey, RESET_HOURLY_WINDOW);
                throw new TooManyRequestsException(
                        "Email này đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau "
                                + Math.max(1, (retryAfter + 59) / 60) + " phút.",
                        retryAfter);
            }
        } catch (DataAccessException ex) {
            log.warn("Redis lỗi khi kiểm tra giới hạn gửi mail reset: {}", ex.getMessage());
        }
    }

    private long incrementWithinWindow(String key, Duration window) {
        Long count = redis.opsForValue().increment(key);
        // Gắn TTL cả khi key lỡ mất TTL (vd. lỗi giữa INCR và EXPIRE), tránh khoá vĩnh viễn.
        if (count != null && (count == 1 || redis.getExpire(key) < 0)) {
            redis.expire(key, window);
        }
        return count == null ? 0 : count;
    }

    private long ttlSeconds(String key, Duration fallback) {
        Long ttl = redis.getExpire(key);
        return ttl == null || ttl <= 0 ? fallback.getSeconds() : ttl;
    }

    // Băm để key Redis có độ dài cố định và không chứa email thô.
    private static String hash(String identifier) {
        String normalized = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 không khả dụng", e);
        }
    }
}
