package com.project_exam.backend.modules.users.service;

import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.repository.RoleRepository;
import com.project_exam.backend.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Nguồn duy nhất để lấy tập userId của các ADMIN.
 * Why: logic "findByRoleName(ADMIN) -> findByRoleId -> map userId" trước đây bị lặp
 * ở TestService (resolveAdminIds/getAdminUserIdSet), QuestionService (getAdminUserIds)...
 * Gom về một chỗ để sửa-một-lần và tránh lệch hành vi giữa các bản sao.
 */
@Component
@RequiredArgsConstructor
public class AdminUserProvider {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    /** Tập userId của tất cả admin (đề/kho công khai = do admin tạo). Rỗng nếu chưa có admin. */
    public Set<String> adminUserIds() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) {
            return Set.of();
        }
        return userRepository.findByRoleId(adminRole.getRoleId()).stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());
    }
}
