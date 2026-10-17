package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeLayoutService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.EXAM_TYPE_LAYOUT_MANAGE)
@RequestMapping("/api/admin/exam-types")
@RequiredArgsConstructor
public class ExamTypeLayoutAdminController {

    private final ExamTypeLayoutService layoutService;

    @GetMapping("/{examTypeId}/layout/own")
    public ResponseEntity<ExamTypeLayoutResponse> getOwnLayout(@PathVariable String examTypeId) {
        ExamTypeLayoutResponse res = layoutService.getOwn(examTypeId);
        return res == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(res);
    }

    @PutMapping("/{examTypeId}/layout")
    public ResponseEntity<ExamTypeLayoutResponse> upsertLayout(
            @PathVariable String examTypeId,
            @RequestBody ExamTypeLayoutRequest request
    ) {
        return ResponseEntity.ok(layoutService.upsert(examTypeId, request));
    }
}
