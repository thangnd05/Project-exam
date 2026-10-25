package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RoleAuthorityCache {

    private static final Duration TTL = Duration.ofSeconds(60);

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    public record RoleAuthorities(String roleName, List<String> permissionCodes) {
    }

    private record Entry(RoleAuthorities authorities, Instant expiresAt) {
        boolean isFresh(Instant now) {
            return now.isBefore(expiresAt);
        }
    }

    // Mọi request đã đăng nhập đều cần tên role + quyền: cache cả hai để khỏi tốn query mỗi lần.
    // Role không còn (đã xoá mềm) thì trả rỗng và không cache.
    public Optional<RoleAuthorities> authoritiesOf(String roleId) {
        Instant now = Instant.now();
        Entry cached = cache.get(roleId);
        if (cached != null && cached.isFresh(now)) {
            return Optional.of(cached.authorities());
        }

        return roleRepository.findById(roleId).map(role -> {
            RoleAuthorities authorities = new RoleAuthorities(
                    role.getRoleName(),
                    List.copyOf(rolePermissionRepository.findPermissionCodesByRoleId(roleId)));
            cache.put(roleId, new Entry(authorities, now.plus(TTL)));
            return authorities;
        });
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
