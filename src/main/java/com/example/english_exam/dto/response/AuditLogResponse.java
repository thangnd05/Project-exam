package com.example.english_exam.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private Long auditLogId;
    private Long userId;
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
