package com.project_exam.backend.shared.util;

import com.project_exam.backend.modules.auth.service.AuthService;
import com.project_exam.backend.shared.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private final AuthService authService;

    public String getUserId(HttpServletRequest request) {
        return authService.getCurrentUserId(request);
    }

    /** Returns userId when authenticated; otherwise null (for public endpoints with optional auth). */
    public String findUserIdOrNull(HttpServletRequest request) {
        try {
            return getUserId(request);
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * Kiểm tra quyền theo authorities trong SecurityContext  được JwtAuthenticationFilter dựng
     * lại từ DB ở mỗi request, KHÔNG lấy từ claim của token. Nhờ vậy đổi vai trò của user hoặc
     * gỡ quyền của vai trò là có hiệu lực ngay, không phải chờ access token hết hạn.
     *
     * Vì lý do đó, đừng thêm lại kiểu lấy roleId từ token để tự so sánh: token là ảnh chụp lúc
     * đăng nhập nên sẽ lạc hậu.
     */
    public boolean hasPermission(String permissionCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return false;
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (permissionCode.equals(authority.getAuthority())) return true;
        }
        return false;
    }

    public void requirePermission(String permissionCode) {
        if (!hasPermission(permissionCode)) {
            throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }
    }

}
