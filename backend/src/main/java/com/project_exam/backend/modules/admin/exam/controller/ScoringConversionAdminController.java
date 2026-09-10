package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionResponse;
import com.project_exam.backend.modules.assessment.exam.service.ScoringConversionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Mặt quản trị của scoring-conversions, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/scoring-conversions")
@RequiredArgsConstructor
public class ScoringConversionAdminController {

    private final ScoringConversionService scoringConversionService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<ScoringConversionResponse> create(
            @Valid @RequestBody ScoringConversionRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.create(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ScoringConversionResponse>> createBulk(
            @RequestBody List<ScoringConversionRequest> requests
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.createBulk(requests));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ScoringConversionRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.ok(scoringConversionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        scoringConversionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
