package com.project_exam.backend.modules.admin.rbac.controller;

import com.project_exam.backend.modules.users.rbac.dto.RolePermissionsRequest;
import com.project_exam.backend.modules.users.rbac.dto.RoleRequest;
import com.project_exam.backend.modules.users.rbac.dto.RoleResponse;
import com.project_exam.backend.modules.users.rbac.service.RoleService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.ROLE_MANAGE)
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class RoleAdminController {

    private final RoleService roleService;

    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable String id,
            @Valid @RequestBody RoleRequest request
    ) {
        return ResponseEntity.ok(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<RoleResponse> updateRolePermissions(
            @PathVariable String id,
            @RequestBody RolePermissionsRequest request
    ) {
        return ResponseEntity.ok(roleService.updatePermissions(id, request.getCodes()));
    }
}
