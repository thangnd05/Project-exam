package com.project_exam.backend.modules.audit.service;

import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.audit.dto.AuditLogResponse;
import com.project_exam.backend.modules.audit.domain.AuditLog;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.audit.repository.AuditLogRepository;
import com.project_exam.backend.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private static final List<String> LOGIN_ACTIONS = List.of("LOGIN", "LOGOUT");

    public AuditLog save(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    public PageResponse<AuditLogResponse> getRecentLogs(String userId, int page, int size) {
        PageRequest pageable = buildPageRequest(page, size);
        Page<AuditLog> logPage = userId == null
                ? auditLogRepository.findAll(pageable)
                : auditLogRepository.findByUserId(userId, pageable);
        return toPageResponse(logPage);
    }

    public PageResponse<AuditLogResponse> getLoginLogs(String userId, int page, int size) {
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

    private PageResponse<AuditLogResponse> toPageResponse(Page<AuditLog> logPage) {
        Set<String> userIds = logPage.getContent().stream()
                .map(AuditLog::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        return PageResponse.from(logPage, logPage.getContent().stream()
                .map(log -> toResponse(log, usersById.get(log.getUserId())))
                .toList());
    }

    private AuditLogResponse toResponse(AuditLog auditLog, User user) {
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
