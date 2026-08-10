package com.project_exam.backend.infrastructure.web;

import com.project_exam.backend.modules.audit.domain.AuditLog;
import com.project_exam.backend.modules.audit.service.AuditContext;
import com.project_exam.backend.modules.audit.service.AuditLogService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class AuditLogInterceptor implements HandlerInterceptor {

    private static final Set<String> AUDIT_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final AuditLogService auditLogService;
    private final AuthUtils authUtils;

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        String method = request.getMethod();
        String endpoint = request.getRequestURI();

        if (!AUDIT_METHODS.contains(method) || endpoint.startsWith("/api/admin/audits")) {
            return;
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(extractUserIdSafely(request));
        auditLog.setHttpMethod(method);
        auditLog.setEndpoint(endpoint);
        auditLog.setAction(resolveAction(method, endpoint));
        auditLog.setResource(resolveResource(endpoint));
        auditLog.setResourceId(resolveResourceId(endpoint));
        auditLog.setIpAddress(request.getRemoteAddr());
        auditLog.setUserAgent(request.getHeader("User-Agent"));

        Object details = request.getAttribute(AuditContext.ATTRIBUTE);
        if (details != null) {
            auditLog.setDetails(String.valueOf(details));
        }

        int statusCode = response.getStatus();
        auditLog.setStatusCode(statusCode);
        auditLog.setSuccess(statusCode >= 200 && statusCode < 400);

        auditLogService.save(auditLog);
    }

    private String extractUserIdSafely(HttpServletRequest request) {
        Object auditUserId = request.getAttribute("AUDIT_USER_ID");
        if (auditUserId != null) {
            return String.valueOf(auditUserId);
        }
        try {
            return authUtils.getUserId(request);
        } catch (Exception exception) {
            return null;
        }
    }

    private String resolveAction(String method, String endpoint) {
        if ("POST".equals(method) && "/api/auth/login".equals(endpoint)) {
            return "LOGIN";
        }
        if ("POST".equals(method) && "/api/auth/logout".equals(endpoint)) {
            return "LOGOUT";
        }
        return switch (method) {
            case "POST" -> "CREATE";
            case "PUT" -> "UPDATE";
            case "PATCH" -> "UPDATE_PARTIAL";
            case "DELETE" -> "DELETE";
            default -> "UNKNOWN";
        };
    }

    private String resolveResource(String endpoint) {
        String[] parts = endpoint.split("/");
        if (parts.length >= 3) {
            return parts[2];
        }
        return "unknown";
    }

    private String resolveResourceId(String endpoint) {
        String[] parts = endpoint.split("/");
        if (parts.length >= 4) {
            try {
                return parts[3];
            } catch (IllegalArgumentException exception) {
                return null;
            }
        }
        return null;
    }
}
