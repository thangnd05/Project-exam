package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.SkillRequest;
import com.project_exam.backend.modules.assessment.exam.dto.SkillResponse;
import com.project_exam.backend.modules.assessment.exam.service.SkillService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Mặt quản trị của skills, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/skills")
@RequiredArgsConstructor
public class SkillAdminController {

    private final SkillService skillService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody SkillRequest request) {
        authUtils.requirePermission(PermissionCatalog.SKILL_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillResponse> update(
            @PathVariable String id,
            @Valid @RequestBody SkillRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.SKILL_MANAGE);
        return ResponseEntity.ok(skillService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.SKILL_MANAGE);
        skillService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
