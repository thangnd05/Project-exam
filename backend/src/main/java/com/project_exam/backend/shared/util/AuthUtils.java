package com.project_exam.backend.shared.util;

import com.project_exam.backend.modules.auth.dto.UserTokenInfo;
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

    // 🟢 Lấy userId nhanh
    public String getUserId(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request).getUserId();
    }

    // 🟢 Lấy roleId nhanh
    public String getRoleId(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request).getRoleId();
    }

    // 🟢 Lấy cả user info nếu cần nhiều hơn
    public UserTokenInfo getUserInfo(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request);
    }

    // 🟢 RBAC granular: kiểm tra user hiện tại có permission (theo code, vd PermissionCatalog.EXAM_TYPE_MANAGE).
    // Đọc trực tiếp từ SecurityContext (authorities đã được nạp mỗi request từ role) → không tốn query thêm.
    // An toàn với guest/unauthenticated: trả false.
    public boolean hasPermission(String permissionCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return false;
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (permissionCode.equals(authority.getAuthority())) return true;
        }
        return false;
    }

    // 🛡 Yêu cầu một permission — throw ForbiddenException nếu thiếu.
    public void requirePermission(String permissionCode) {
        if (!hasPermission(permissionCode)) {
            throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }
    }

}
