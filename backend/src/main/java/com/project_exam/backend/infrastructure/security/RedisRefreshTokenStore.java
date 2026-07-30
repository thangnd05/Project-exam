package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.ReplayDetectedException;
import com.project_exam.backend.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RedisRefreshTokenStore implements RefreshTokenStore {

    private static final Logger log = LoggerFactory.getLogger(RedisRefreshTokenStore.class);

    private static final String FAMILY_KEY_PREFIX = "rt:family:";
    private static final String USER_KEY_PREFIX = "rt:user:";
    private static final String FIELD_USER_ID = "uid";
    private static final String FIELD_JTI = "jti";
    private static final String FIELD_PREV_JTI = "prevJti";
    private static final String FIELD_PREV_AT = "prevAt";

    private static final String FIELD_REVOKED = "revoked";

    private static final long GRACE_WINDOW_MS = 10_000;

    private final StringRedisTemplate redis;

    @Value("${jwt.refresh.expiration}")
    private long refreshExpirationMs;

    @Override
    public void createFamily(String userId, String familyId, String jti) {
        String familyKey = familyKey(familyId);
        String userKey = userKey(userId);
        Duration ttl = Duration.ofMillis(refreshExpirationMs);

        try {
            redis.opsForHash().put(familyKey, FIELD_USER_ID, userId);
            redis.opsForHash().put(familyKey, FIELD_JTI, jti);
            redis.expire(familyKey, ttl);

            redis.opsForSet().add(userKey, familyId);
            redis.expire(userKey, ttl);
        } catch (DataAccessException ex) {
            log.error("Redis down khi createFamily uid={} fid={}: {}", userId, familyId, ex.getMessage());
            throw new UnauthorizedException("Hệ thống xác thực tạm thời không khả dụng, vui lòng thử lại.");
        }
    }

    @Override
    public String rotate(String userId, String familyId, String oldJti) {
        String familyKey = familyKey(familyId);

        try {
            if (redis.opsForHash().get(familyKey, FIELD_REVOKED) != null) {

                throw new UnauthorizedException("Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại.");
            }

            Object storedUid = redis.opsForHash().get(familyKey, FIELD_USER_ID);
            Object storedJti = redis.opsForHash().get(familyKey, FIELD_JTI);

            if (storedUid == null || storedJti == null) {
                createFamily(userId, familyId, oldJti);
                storedUid = userId;
                storedJti = oldJti;
            }

            if (!userId.equals(storedUid.toString())) {

                log.warn("SECURITY_REFRESH_UID_MISMATCH expected={} got={} fid={}", storedUid, userId, familyId);
                revokeFamilyInternal(storedUid.toString(), familyId);
                throw new ReplayDetectedException("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.");
            }

            String currentJti = storedJti.toString();

            if (currentJti.equals(oldJti)) {
                String newJti = UUID.randomUUID().toString();
                Duration ttl = Duration.ofMillis(refreshExpirationMs);
                redis.opsForHash().put(familyKey, FIELD_JTI, newJti);

                redis.opsForHash().put(familyKey, FIELD_PREV_JTI, currentJti);
                redis.opsForHash().put(familyKey, FIELD_PREV_AT, String.valueOf(System.currentTimeMillis()));
                redis.expire(familyKey, ttl);
                redis.expire(userKey(userId), ttl);
                return newJti;
            }

            Object prevJti = redis.opsForHash().get(familyKey, FIELD_PREV_JTI);
            Object prevAt = redis.opsForHash().get(familyKey, FIELD_PREV_AT);
            if (prevJti != null && prevAt != null
                    && prevJti.toString().equals(oldJti)
                    && (System.currentTimeMillis() - Long.parseLong(prevAt.toString())) <= GRACE_WINDOW_MS) {
                log.debug("REFRESH_GRACE_HIT uid={} fid={} — late client caught up", userId, familyId);
                return currentJti;
            }

            log.warn("SECURITY_REFRESH_REPLAY uid={} fid={} expectedJti={} prevJti={} gotJti={}",
                    userId, familyId, currentJti, prevJti, oldJti);
            revokeFamilyInternal(userId, familyId);
            throw new ReplayDetectedException("Phát hiện phiên đăng nhập bất thường, vui lòng đăng nhập lại.");
        } catch (DataAccessException ex) {
            log.error("Redis down khi rotate uid={} fid={}: {}", userId, familyId, ex.getMessage());
            throw new UnauthorizedException("Hệ thống xác thực tạm thời không khả dụng, vui lòng thử lại.");
        }
    }

    @Override
    public void revokeFamily(String userId, String familyId) {
        try {
            revokeFamilyInternal(userId, familyId);
        } catch (DataAccessException ex) {
            log.warn("Redis lỗi khi revokeFamily uid={} fid={}: {}", userId, familyId, ex.getMessage());
        }
    }

    @Override
    public void revokeAllForUser(String userId) {
        String userKey = userKey(userId);
        try {
            Set<String> families = redis.opsForSet().members(userKey);
            if (families != null) {
                for (String fid : families) {
                    markRevoked(familyKey(fid));
                }
            }
            redis.delete(userKey);
        } catch (DataAccessException ex) {
            log.error("Redis lỗi khi revokeAllForUser uid={}: {}", userId, ex.getMessage());
        }
    }

    private void revokeFamilyInternal(String userId, String familyId) {
        markRevoked(familyKey(familyId));
        redis.opsForSet().remove(userKey(userId), familyId);
    }

    private void markRevoked(String familyKey) {
        redis.opsForHash().put(familyKey, FIELD_REVOKED, "1");
        redis.opsForHash().delete(familyKey, FIELD_JTI, FIELD_PREV_JTI, FIELD_PREV_AT);
        redis.expire(familyKey, Duration.ofMillis(refreshExpirationMs));
    }

    private String familyKey(String familyId) {
        return FAMILY_KEY_PREFIX + familyId;
    }

    private String userKey(String userId) {
        return USER_KEY_PREFIX + userId;
    }
}
