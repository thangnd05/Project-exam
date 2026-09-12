package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RoleAuthorityCache {

    private static final Duration TTL = Duration.ofSeconds(60);

    private final RolePermissionRepository rolePermissionRepository;

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    private record Entry(List<String> codes, Instant expiresAt) {
        boolean isFresh(Instant now) {
            return now.isBefore(expiresAt);
        }
    }

    public List<String> permissionCodesOf(String roleId) {
        Instant now = Instant.now();
        Entry cached = cache.get(roleId);
        if (cached != null && cached.isFresh(now)) {
            return cached.codes();
        }

        List<String> codes = List.copyOf(rolePermissionRepository.findPermissionCodesByRoleId(roleId));
        cache.put(roleId, new Entry(codes, now.plus(TTL)));
        return codes;
    }

    public void invalidate(String roleId) {
        cache.remove(roleId);
    }

    public void invalidateAfterCommit(String roleId) {
        cache.remove(roleId);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    cache.remove(roleId);
                }
            });
        }
    }

    public void invalidateAll() {
        cache.clear();
    }
}
