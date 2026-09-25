package com.project_exam.backend.modules.admin.target.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneRequest;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneResponse;
import com.project_exam.backend.modules.assessment.target.service.MilestoneService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Mặt quản trị của milestones, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/milestones")
@RequiredArgsConstructor
public class MilestoneAdminController {

    private final MilestoneService milestoneService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<MilestoneResponse> create(
            @Valid @RequestBody MilestoneRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.MILESTONE_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneResponse> update(
            @PathVariable String id,
            @Valid @RequestBody MilestoneRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.MILESTONE_MANAGE);
        return ResponseEntity.ok(milestoneService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.MILESTONE_MANAGE);
        milestoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
