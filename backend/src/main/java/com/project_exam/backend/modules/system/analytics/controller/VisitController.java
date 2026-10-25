package com.project_exam.backend.modules.system.analytics.controller;

import com.project_exam.backend.modules.system.analytics.dto.VisitRequest;
import com.project_exam.backend.modules.system.analytics.service.VisitRateLimiter;
import com.project_exam.backend.modules.system.analytics.service.VisitTrackingService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

        // IP thật đã được Tomcat lấy từ X-Forwarded-* của proxy tin cậy (forward-headers-strategy=native).
        String ip = request.getRemoteAddr();

        // Đếm theo IP, không theo X-Guest-Session: header do client tự đặt, đổi mỗi request là vượt giới hạn
        // và mỗi session mới thành một dòng page_visit mới.
        if (!rateLimiter.allow(ip)) {
            return ResponseEntity.noContent().build();
        }

        String userId = authUtils.findUserIdOrNull(request);
        if (body.isIdentify()) {
            visitTrackingService.identify(sessionKey, userId);
        } else {
            visitTrackingService.record(body.getPath(), sessionKey, userId, ip);
        }
        return ResponseEntity.noContent().build();
    }
}
