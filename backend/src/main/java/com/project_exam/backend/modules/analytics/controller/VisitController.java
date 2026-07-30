package com.project_exam.backend.modules.analytics.controller;

import com.project_exam.backend.modules.analytics.dto.VisitRequest;
import com.project_exam.backend.modules.analytics.service.VisitRateLimiter;
import com.project_exam.backend.modules.analytics.service.VisitTrackingService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class VisitController {

    private final VisitTrackingService visitTrackingService;
    private final VisitRateLimiter rateLimiter;
    private final AuthUtils authUtils;

    @PostMapping("/visit")
    public ResponseEntity<Void> track(
            @RequestBody VisitRequest body,
            @RequestHeader(value = "X-Guest-Session", required = false) String sessionKey,
            HttpServletRequest request) {

        String ip = clientIp(request);

        if (!rateLimiter.allow(StringUtils.hasText(sessionKey) ? sessionKey : ip)) {
            return ResponseEntity.noContent().build();
        }

        String userId = null;
        try {
            userId = authUtils.getUserId(request);
        } catch (Exception ignored) {

        }

        visitTrackingService.record(body.getPath(), sessionKey, userId, ip);
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
