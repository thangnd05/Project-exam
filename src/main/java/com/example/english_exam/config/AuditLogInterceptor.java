package com.example.english_exam.config;

import com.example.english_exam.models.AuditLog;
import com.example.english_exam.services.AuditLogService;
import com.example.english_exam.util.AuthUtils;
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
        auditLog.setAction(resolveAction(method));
        auditLog.setResource(resolveResource(endpoint));
        auditLog.setResourceId(resolveResourceId(endpoint));
        auditLog.setIpAddress(request.getRemoteAddr());
        auditLog.setUserAgent(request.getHeader("User-Agent"));

        int statusCode = response.getStatus();
        auditLog.setStatusCode(statusCode);
        auditLog.setSuccess(statusCode >= 200 && statusCode < 400);

        auditLogService.save(auditLog);
    }

    private Long extractUserIdSafely(HttpServletRequest request) {
        try {
            return authUtils.getUserId(request);
        } catch (Exception exception) {
            return null;
        }
    }

    private String resolveAction(String method) {
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
            return parts[3];
        }
        return null;
    }
}
