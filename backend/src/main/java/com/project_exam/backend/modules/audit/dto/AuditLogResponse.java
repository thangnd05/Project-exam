package com.project_exam.backend.modules.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private String auditLogId;
    private String userId;
    private String userName;
    private String fullName;
    private String httpMethod;
    private String endpoint;
    private String action;
    private String resource;
    private String resourceId;
    private String ipAddress;
    private String userAgent;
    private Integer statusCode;
    private Boolean success;
    private String details;
    private Instant createdAt;
}
