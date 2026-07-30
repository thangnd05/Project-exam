package com.project_exam.backend.modules.gamification.cosmetic.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticRequest;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import com.project_exam.backend.modules.gamification.cosmetic.service.CosmeticService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cosmetics")
@RequiredArgsConstructor
public class CosmeticAdminController {

    private final CosmeticService cosmeticService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<CosmeticResponse>> getAll(HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.COSMETIC_MANAGE);
        return ResponseEntity.ok(cosmeticService.findAll());
    }

    @PostMapping
    public ResponseEntity<CosmeticResponse> create(
            @Valid @RequestBody CosmeticRequest request, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.COSMETIC_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(cosmeticService.create(request));
    }

    @PutMapping("/{cosmeticId}")
    public ResponseEntity<CosmeticResponse> update(
            @PathVariable String cosmeticId,
            @Valid @RequestBody CosmeticRequest request,
            HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.COSMETIC_MANAGE);
        return ResponseEntity.ok(cosmeticService.update(cosmeticId, request));
    }

    @DeleteMapping("/{cosmeticId}")
    public ResponseEntity<Void> delete(
            @PathVariable String cosmeticId, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.COSMETIC_MANAGE);
        cosmeticService.delete(cosmeticId);
        return ResponseEntity.noContent().build();
    }
}
