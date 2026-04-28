package com.project_exam.backend.modules.audit.controller;

import com.project_exam.backend.modules.audit.dto.AuditLogPageResponse;
import com.project_exam.backend.modules.audit.service.AuditLogService;
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

    @GetMapping
    public ResponseEntity<AuditLogPageResponse> getRecentAudits(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ResponseEntity.ok(auditLogService.getRecentLogs(userId, page, size));
    }

    @GetMapping("/login")
    public ResponseEntity<AuditLogPageResponse> getLoginAudits(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ResponseEntity.ok(auditLogService.getLoginLogs(userId, page, size));
    }
}
