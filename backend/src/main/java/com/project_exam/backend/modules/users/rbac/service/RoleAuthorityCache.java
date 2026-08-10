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

/**
 * Cache mã quyền theo vai trò.
 *
 * JwtAuthenticationFilter dựng lại quyền từ DB ở MỌI request (cố ý: gỡ quyền là có hiệu lực
 * ngay, không phải chờ token hết hạn), nhưng như vậy mỗi lần gọi API tốn thêm một query đọc
 * role_permissions. Số vai trò thì rất ít và đổi rất hiếm nên cache trong tiến trình là đủ.
 *
 * Đường ghi role_permissions duy nhất là RoleService, và nó gọi invalidateAfterCommit() nên
 * cùng một instance thì quyền mới có hiệu lực tức thì. TTL chỉ là lưới an toàn cho trường hợp
 * chạy nhiều instance (instance không nhận request sửa quyền sẽ tự hết hạn sau TTL).
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

    /**
     * Xoá cache của vai trò, và xoá lại một lần nữa sau khi transaction kết thúc.
     *
     * Gọi invalidate() trần bên trong @Transactional là chưa đủ: quyền mới chưa commit, nên một
     * request khác xen vào giữa lúc đó sẽ đọc DB ra bộ quyền CŨ rồi nạp lại vào cache và giữ
     * nguyên đến hết TTL. Xoá thêm ở afterCompletion để lần đọc kế tiếp chắc chắn thấy dữ liệu
     * đã commit (rollback cũng xoá — chỉ tốn đúng một lần đọc lại).
     */
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
