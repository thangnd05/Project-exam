package com.project_exam.backend.shared.util;

import com.project_exam.backend.modules.auth.dto.UserTokenInfo;
import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.repository.RoleRepository;
import com.project_exam.backend.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private static final String ADMIN_ROLE = "ADMIN";

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

    // 🟢 Kiểm tra request có thuộc về admin không (an toàn với guest/null roleId)
    public boolean isAdmin(HttpServletRequest request) {
        try {
            String roleId = authService.getCurrentUserInfo(request).getRoleId();
            if (roleId == null) return false;
            Role role = roleRepository.findById(roleId).orElse(null);
            return role != null && ADMIN_ROLE.equalsIgnoreCase(role.getRoleName());
        } catch (Exception e) {
            return false;
        }
    }

}
