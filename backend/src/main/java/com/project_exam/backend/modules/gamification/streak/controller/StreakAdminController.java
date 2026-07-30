package com.project_exam.backend.modules.gamification.streak.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigRequest;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.service.StreakRecoverConfigService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/streak/recover-config")
@RequiredArgsConstructor
public class StreakAdminController {

    private final StreakRecoverConfigService recoverConfigService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<StreakRecoverConfigResponse> get(HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.STREAK_CONFIG_MANAGE);
        return ResponseEntity.ok(recoverConfigService.get());
    }

    @PutMapping
    public ResponseEntity<StreakRecoverConfigResponse> update(
            @Valid @RequestBody StreakRecoverConfigRequest request, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.STREAK_CONFIG_MANAGE);
        return ResponseEntity.ok(recoverConfigService.update(request));
    }
}
