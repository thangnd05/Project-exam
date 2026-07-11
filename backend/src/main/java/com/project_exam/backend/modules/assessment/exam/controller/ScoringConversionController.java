package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionResponse;
import com.project_exam.backend.modules.assessment.exam.service.ScoringConversionService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Bảng quy đổi điểm (vd. TOEIC raw scaled). GET mở để display result;
 * CUD admin-only — sửa bảng = sửa điểm của mọi student trong hệ thống.
 */
@RestController
@RequestMapping("/api/scoring-conversions")
@RequiredArgsConstructor
public class ScoringConversionController {

    private final ScoringConversionService scoringConversionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<ScoringConversionResponse>> getAll(
            @RequestParam(required = false) String examTypeId,
            @RequestParam(required = false) String skillId
    ) {
        return ResponseEntity.ok(scoringConversionService.findByFilters(examTypeId, skillId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(scoringConversionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScoringConversionResponse> create(
            @Valid @RequestBody ScoringConversionRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.create(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ScoringConversionResponse>> createBulk(
            @RequestBody List<ScoringConversionRequest> requests,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.createBulk(requests));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ScoringConversionRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        return ResponseEntity.ok(scoringConversionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.SCORING_CONVERSION_MANAGE);
        scoringConversionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
