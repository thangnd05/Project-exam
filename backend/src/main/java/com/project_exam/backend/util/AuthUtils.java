package com.project_exam.backend.util;

import com.project_exam.backend.dto.auth.UserTokenInfo;
import com.project_exam.backend.models.Role;
import com.project_exam.backend.repositories.RoleRepository;
import com.project_exam.backend.security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private final AuthService authService;
    private final RoleRepository roleRepository;

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

}
