package com.example.english_exam.services;

import com.example.english_exam.models.AuditLog;
import com.example.english_exam.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog save(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getRecentLogs(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));

        List<AuditLog> logs = userId == null
                ? auditLogRepository.findTop200ByOrderByCreatedAtDesc()
                : auditLogRepository.findTop200ByUserIdOrderByCreatedAtDesc(userId);

        return logs.stream().limit(safeLimit).toList();
    }
}
