package com.project_exam.backend.modules.audit.controller;

import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.audit.dto.AuditLogResponse;
import com.project_exam.backend.modules.audit.service.AuditLogService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audits")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<PageResponse<AuditLogResponse>> getRecentAudits(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        authUtils.requirePermission(PermissionCatalog.AUDIT_VIEW);
        return ResponseEntity.ok(auditLogService.getRecentLogs(userId, page, size));
    }

    @GetMapping("/login")
    public ResponseEntity<PageResponse<AuditLogResponse>> getLoginAudits(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        authUtils.requirePermission(PermissionCatalog.AUDIT_VIEW);
        return ResponseEntity.ok(auditLogService.getLoginLogs(userId, page, size));
    }
}
