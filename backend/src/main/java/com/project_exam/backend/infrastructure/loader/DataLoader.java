package com.project_exam.backend.infrastructure.loader;

import com.project_exam.backend.modules.users.rbac.domain.Permission;
import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.rbac.domain.RolePermission;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.rbac.repository.PermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1) Upsert toàn bộ permission từ catalog (idempotent theo code)
        for (PermissionCatalog.Def def : PermissionCatalog.ALL) {
            Permission permission = permissionRepository.findByCode(def.code()).orElseGet(Permission::new);
            permission.setCode(def.code());
            permission.setDescription(def.description());
            permission.setGroupName(def.groupName());
            permissionRepository.save(permission);
        }

        // 2) Role ADMIN — luôn được gán đủ mọi permission (nối qua bảng role_permissions)
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) {
            adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            adminRole.setDescription("Quyền quản trị viên");
            adminRole = roleRepository.save(adminRole);
        }
        for (Permission permission : permissionRepository.findAll()) {
            if (!rolePermissionRepository.existsByRoleIdAndPermissionId(adminRole.getRoleId(), permission.getPermissionId())) {
                rolePermissionRepository.save(RolePermission.builder()
                        .roleId(adminRole.getRoleId())
                        .permissionId(permission.getPermissionId())
                        .build());
            }
        }

        // 3) Role USER — mặc định không có permission quản trị (đăng ký/OAuth lookup role này)
        Role userRole = roleRepository.findByRoleName("USER");
        if (userRole == null) {
            userRole = new Role();
            userRole.setRoleName("USER");
            userRole.setDescription("Người dùng thông thường");
            roleRepository.save(userRole);
        }

        // 4) User admin mặc định
        Optional<User> adminUser = userRepository.findByUserName("WinDe");
        if (adminUser.isEmpty()) {
            User user = new User();
            user.setUserName("WinDe");
            user.setFullName("WinDe");
            user.setEmail("winde");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setRoleId(adminRole.getRoleId());
            user.setCreatedAt(LocalDateTime.now());
            user.setVerified(true);
            user.setAvatarUrl(buildDefaultAvatar(user.getFullName()));
            userRepository.save(user);
        }

        System.out.println("DataLoader: permissions seeded, ADMIN granted all, USER role ensured, admin user ready.");
    }

    private String buildDefaultAvatar(String name) {
        String safeName = (name == null || name.isBlank()) ? "Admin" : name.trim().replace(" ", "+");
        return "https://ui-avatars.com/api/?name=" + safeName + "&background=random&color=fff";
    }
}
