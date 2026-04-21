package com.project_exam.backend.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private String auditLogId;
    private String userId;
    private String httpMethod;
    private String endpoint;
    private String action;
    private String resource;
    private String resourceId;
    private String ipAddress;
    private String userAgent;
    private Integer statusCode;
    private Boolean success;
    private LocalDateTime createdAt;
}
