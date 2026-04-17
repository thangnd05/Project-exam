package com.example.english_exam.services;

import com.example.english_exam.dto.response.AuditLogPageResponse;
import com.example.english_exam.dto.response.AuditLogResponse;
import com.example.english_exam.models.AuditLog;
import com.example.english_exam.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog save(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    public AuditLogPageResponse getRecentLogs(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 200));

        PageRequest pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<AuditLog> logPage = userId == null
                ? auditLogRepository.findAll(pageable)
                : auditLogRepository.findByUserId(userId, pageable);

        AuditLogPageResponse response = new AuditLogPageResponse();
        response.setContent(logPage.getContent().stream()
                .map(this::toResponse)
                .toList());
        response.setCurrentPage(logPage.getNumber());
        response.setSize(logPage.getSize());
        response.setTotalElements(logPage.getTotalElements());
        response.setTotalPages(logPage.getTotalPages());
        response.setHasNext(logPage.hasNext());
        return response;
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        AuditLogResponse response = new AuditLogResponse();
        response.setAuditLogId(auditLog.getAuditLogId());
        response.setUserId(auditLog.getUserId());
        response.setHttpMethod(auditLog.getHttpMethod());
        response.setEndpoint(auditLog.getEndpoint());
        response.setAction(auditLog.getAction());
        response.setResource(auditLog.getResource());
        response.setResourceId(auditLog.getResourceId());
        response.setIpAddress(auditLog.getIpAddress());
        response.setUserAgent(auditLog.getUserAgent());
        response.setStatusCode(auditLog.getStatusCode());
        response.setSuccess(auditLog.getSuccess());
        response.setCreatedAt(auditLog.getCreatedAt());
        return response;
    }
}
