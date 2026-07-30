package com.project_exam.backend.modules.users.user.service;

import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AdminUserProvider {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

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
