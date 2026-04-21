package com.project_exam.backend.services;

import com.project_exam.backend.dto.response.AuditLogPageResponse;
import com.project_exam.backend.dto.response.AuditLogResponse;
import com.project_exam.backend.models.AuditLog;
import com.project_exam.backend.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private static final List<String> LOGIN_ACTIONS = List.of("LOGIN", "LOGOUT");

    public AuditLog save(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    public AuditLogPageResponse getRecentLogs(String userId, int page, int size) {
        PageRequest pageable = buildPageRequest(page, size);
        Page<AuditLog> logPage = userId == null
                ? auditLogRepository.findAll(pageable)
                : auditLogRepository.findByUserId(userId, pageable);
        return toPageResponse(logPage);
    }

    public AuditLogPageResponse getLoginLogs(String userId, int page, int size) {
        PageRequest pageable = buildPageRequest(page, size);
        Page<AuditLog> logPage = userId == null
                ? auditLogRepository.findByActionIn(LOGIN_ACTIONS, pageable)
                : auditLogRepository.findByUserIdAndActionIn(userId, LOGIN_ACTIONS, pageable);
        return toPageResponse(logPage);
    }

    private PageRequest buildPageRequest(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 200));

        return PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
    }

    private AuditLogPageResponse toPageResponse(Page<AuditLog> logPage) {
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
