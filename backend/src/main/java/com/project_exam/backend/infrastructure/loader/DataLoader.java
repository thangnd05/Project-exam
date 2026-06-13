package com.project_exam.backend.infrastructure.loader;

import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.repository.RoleRepository;
import com.project_exam.backend.modules.users.repository.UserRepository;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra xem role admin đã tồn tại chưa
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) {
            adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            adminRole.setDescription("Quyền quản trị viên");
            roleRepository.save(adminRole);
        }

        // Kiểm tra user admin
        Optional<User> adminUser = userRepository.findByUserName("WinDe");
        if(adminUser.isEmpty()){
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

        System.out.println("DataLoader: Default role and admin user created (if not exist).");
    }

    private String buildDefaultAvatar(String name) {
        String safeName = (name == null || name.isBlank()) ? "Admin" : name.trim().replace(" ", "+");
        return "https://ui-avatars.com/api/?name=" + safeName + "&background=random&color=fff";
    }
}
