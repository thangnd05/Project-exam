package com.example.english_exam.controllers;

import com.example.english_exam.models.AuditLog;
import com.example.english_exam.services.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audits")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getRecentAudits(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "50") Integer limit
    ) {
        return ResponseEntity.ok(auditLogService.getRecentLogs(userId, limit));
    }
}
