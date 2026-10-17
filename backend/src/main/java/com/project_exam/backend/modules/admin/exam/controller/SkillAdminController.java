package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.SkillRequest;
import com.project_exam.backend.modules.assessment.exam.dto.SkillResponse;
import com.project_exam.backend.modules.assessment.exam.service.SkillService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.SKILL_MANAGE)
@RequestMapping("/api/admin/skills")
@RequiredArgsConstructor
public class SkillAdminController {

    private final SkillService skillService;

    @PostMapping
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillResponse> update(
            @PathVariable String id,
            @Valid @RequestBody SkillRequest request
    ) {
        return ResponseEntity.ok(skillService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        skillService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
