package com.project_exam.backend.modules.admin.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationTestStatsResponse;
import com.project_exam.backend.modules.assessment.attempt.service.EvaluationService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequirePermission(PermissionCatalog.EVALUATION_MANAGE)
@RequestMapping("/api/admin/evaluations")
@RequiredArgsConstructor
public class EvaluationAdminController {

    private final EvaluationService evaluationService;

    @GetMapping
    public ResponseEntity<PageResponse<EvaluationResponse>> getAllPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String testId
    ) {
        return ResponseEntity.ok(evaluationService.getAllPaged(page, size, keyword, rating, testId));
    }

    @GetMapping("/stats")
    public ResponseEntity<List<EvaluationTestStatsResponse>> getStatsByTest() {
        return ResponseEntity.ok(evaluationService.getStatsByTest());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        evaluationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
