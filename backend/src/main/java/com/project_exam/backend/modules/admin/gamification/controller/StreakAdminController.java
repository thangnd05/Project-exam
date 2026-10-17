package com.project_exam.backend.modules.admin.gamification.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;

import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigRequest;
import com.project_exam.backend.modules.gamification.streak.dto.StreakRecoverConfigResponse;
import com.project_exam.backend.modules.gamification.streak.service.StreakRecoverConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.STREAK_CONFIG_MANAGE)
@RequestMapping("/api/admin/streak/recover-config")
@RequiredArgsConstructor
public class StreakAdminController {

    private final StreakRecoverConfigService recoverConfigService;

    @GetMapping
    public ResponseEntity<StreakRecoverConfigResponse> get() {
        return ResponseEntity.ok(recoverConfigService.get());
    }

    @PutMapping
    public ResponseEntity<StreakRecoverConfigResponse> update(
            @Valid @RequestBody StreakRecoverConfigRequest request) {
        return ResponseEntity.ok(recoverConfigService.update(request));
    }
}
