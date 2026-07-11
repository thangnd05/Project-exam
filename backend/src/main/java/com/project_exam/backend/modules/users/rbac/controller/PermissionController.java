package com.project_exam.backend.modules.users.rbac.controller;

import com.project_exam.backend.modules.users.rbac.dto.PermissionResponse;
import com.project_exam.backend.modules.users.rbac.repository.PermissionRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * Danh mục permission để trang quản trị dựng ma trận phân quyền. Chỉ người có quyền
 * quản lý vai trò (ROLE:MANAGE) mới xem được.
 */
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRepository permissionRepository;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<PermissionResponse>> getAllPermissions(HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.ROLE_MANAGE);
        List<PermissionResponse> result = permissionRepository.findAll().stream()
                .map(p -> PermissionResponse.builder()
                        .permissionId(p.getPermissionId())
                        .code(p.getCode())
                        .description(p.getDescription())
                        .groupName(p.getGroupName())
                        .build())
                .sorted(Comparator.comparing(PermissionResponse::getGroupName,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(PermissionResponse::getCode))
                .toList();
        return ResponseEntity.ok(result);
    }
}
