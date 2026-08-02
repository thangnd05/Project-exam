package com.project_exam.backend.modules.posts.post.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class PostViewThrottleService {

    private static final Duration VIEW_TTL = Duration.ofMinutes(5);
    private final StringRedisTemplate redisTemplate;

    public boolean shouldCountView(String postId, String userId, String clientIp) {
        String viewerId = resolveViewerId(userId, clientIp);
        String key = "post:view:" + postId + ":" + viewerId;

        try {
            Boolean isFirstSeen = redisTemplate.opsForValue().setIfAbsent(key, "1", VIEW_TTL);
            return Boolean.TRUE.equals(isFirstSeen);
        } catch (DataAccessException ex) {

            return true;
        }
    }

    private String resolveViewerId(String userId, String clientIp) {
        if (userId != null && !userId.isBlank()) {
            return "u:" + userId;
        }

        String ip = (clientIp == null || clientIp.isBlank()) ? "unknown" : clientIp;
        return "g:" + ip;
    }

    public String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null ? "unknown" : remoteAddr;
    }
}
