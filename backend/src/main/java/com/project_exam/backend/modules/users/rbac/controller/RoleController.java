package com.project_exam.backend.modules.users.rbac.controller;

import com.project_exam.backend.modules.users.rbac.dto.RolePermissionsRequest;
import com.project_exam.backend.modules.users.rbac.dto.RoleRequest;
import com.project_exam.backend.modules.users.rbac.dto.RoleResponse;
import com.project_exam.backend.modules.users.rbac.service.RoleService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        return ResponseEntity.ok(roleService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> getRoleById(@PathVariable String id) {
        return ResponseEntity.ok(roleService.findById(id));
    }

    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable String id,
            @Valid @RequestBody RoleRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        return ResponseEntity.ok(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Gán lại danh sách permission cho role (ma trận phân quyền trên UI admin). */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<RoleResponse> updateRolePermissions(
            @PathVariable String id,
            @RequestBody RolePermissionsRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        return ResponseEntity.ok(roleService.updatePermissions(id, request.getCodes()));
    }
}
