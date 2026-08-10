package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache mã quyền theo vai trò.
 *
 * JwtAuthenticationFilter dựng lại quyền từ DB ở MỌI request (cố ý: gỡ quyền là có hiệu lực
 * ngay, không phải chờ token hết hạn), nhưng như vậy mỗi lần gọi API tốn thêm một query đọc
 * role_permissions. Số vai trò thì rất ít và đổi rất hiếm nên cache trong tiến trình là đủ.
 *
 * TTL ngắn + xoá cache ngay khi RoleService đổi quyền: cùng một instance thì thấy tức thì,
 * nhiều instance thì chậm nhất là hết TTL.
 */
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

    public void invalidateAll() {
        cache.clear();
    }
}
