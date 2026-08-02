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

    public String getUserId(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request).getUserId();
    }

    /** Returns userId when authenticated; otherwise null (for public endpoints with optional auth). */
    public String findUserIdOrNull(HttpServletRequest request) {
        try {
            return getUserId(request);
        } catch (Exception ignored) {
            return null;
        }
    }

    public String getRoleId(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request).getRoleId();
    }

    public UserTokenInfo getUserInfo(HttpServletRequest request) {
        return authService.getCurrentUserInfo(request);
    }

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
