package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeLayoutService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Mặt quản trị của exam-types, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/exam-types")
@RequiredArgsConstructor
public class ExamTypeLayoutAdminController {

    private final ExamTypeLayoutService layoutService;
    private final AuthUtils authUtils;

    @GetMapping("/{examTypeId}/layout/own")
    public ResponseEntity<ExamTypeLayoutResponse> getOwnLayout(@PathVariable String examTypeId) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_LAYOUT_MANAGE);
        ExamTypeLayoutResponse res = layoutService.getOwn(examTypeId);
        return res == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(res);
    }

    @PutMapping("/{examTypeId}/layout")
    public ResponseEntity<ExamTypeLayoutResponse> upsertLayout(
            @PathVariable String examTypeId,
            @RequestBody ExamTypeLayoutRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_LAYOUT_MANAGE);
        return ResponseEntity.ok(layoutService.upsert(examTypeId, request));
    }
}
