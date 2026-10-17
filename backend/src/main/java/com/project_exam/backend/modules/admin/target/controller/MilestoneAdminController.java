package com.project_exam.backend.modules.admin.target.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneRequest;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneResponse;
import com.project_exam.backend.modules.assessment.target.service.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Mặt quản trị của milestones, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần cùng một quyền nên đặt @RequirePermission ở cấp class.
 */
@RestController
@RequirePermission(PermissionCatalog.MILESTONE_MANAGE)
@RequestMapping("/api/admin/milestones")
@RequiredArgsConstructor
public class MilestoneAdminController {

    private final MilestoneService milestoneService;

    @PostMapping
    public ResponseEntity<MilestoneResponse> create(
            @Valid @RequestBody MilestoneRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneResponse> update(
            @PathVariable String id,
            @Valid @RequestBody MilestoneRequest request
    ) {
        return ResponseEntity.ok(milestoneService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        milestoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
