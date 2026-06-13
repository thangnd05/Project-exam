package com.project_exam.backend.modules.audit.mapper;

import com.project_exam.backend.modules.audit.domain.AuditLog;
import com.project_exam.backend.modules.audit.dto.AuditLogResponse;
import com.project_exam.backend.modules.users.domain.User;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogResponse toResponse(AuditLog auditLog, User user) {
        return AuditLogResponse.builder()
                .auditLogId(auditLog.getAuditLogId())
                .userId(auditLog.getUserId())
                .userName(user != null ? user.getUserName() : null)
                .fullName(user != null ? user.getFullName() : null)
                .httpMethod(auditLog.getHttpMethod())
                .endpoint(auditLog.getEndpoint())
                .action(auditLog.getAction())
                .resource(auditLog.getResource())
                .resourceId(auditLog.getResourceId())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .statusCode(auditLog.getStatusCode())
                .success(auditLog.getSuccess())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
