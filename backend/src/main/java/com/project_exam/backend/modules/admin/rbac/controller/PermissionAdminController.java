package com.project_exam.backend.modules.admin.rbac.controller;

import com.project_exam.backend.modules.users.rbac.dto.PermissionResponse;
import com.project_exam.backend.modules.users.rbac.service.PermissionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/permissions")
@RequiredArgsConstructor
public class PermissionAdminController {

    private final PermissionService permissionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        return ResponseEntity.ok(permissionService.findAll());
    }
}
