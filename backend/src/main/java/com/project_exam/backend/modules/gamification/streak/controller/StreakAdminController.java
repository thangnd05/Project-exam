package com.project_exam.backend.modules.gamification.streak.controller;

import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigRequest;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.service.StreakRecoverConfigService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Quản lý cấu hình khôi phục chuỗi (giá xu + bật/tắt) cho admin. */
@RestController
@RequestMapping("/api/admin/streak/recover-config")
@AllArgsConstructor
public class StreakAdminController {

    private final StreakRecoverConfigService recoverConfigService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<StreakRecoverConfigResponse> get(HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(recoverConfigService.get());
    }

    @PutMapping
    public ResponseEntity<StreakRecoverConfigResponse> update(
            @Valid @RequestBody StreakRecoverConfigRequest request, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(recoverConfigService.update(request));
    }
}
