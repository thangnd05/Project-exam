package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.Getter;
import lombok.Setter;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Getter
@Setter
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomUserDetailsService(UserRepository userRepository, RoleRepository roleRepository,
                                    RolePermissionRepository rolePermissionRepository,
                                    @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String input) throws UsernameNotFoundException {

        User user = userRepository.findByUserName(input)
                .or(() -> userRepository.findByEmail(input))
                .orElseThrow(() ->
                        new UsernameNotFoundException("Không tìm thấy người dùng với: " + input));

        // [TẮT XÁC THỰC EMAIL] Không chặn đăng nhập theo cờ verified nữa.
        // if (!user.getVerified()) {
        //     throw new UsernameNotFoundException("Tài khoản chưa được xác thực qua email.");
        // }

        Role role = roleRepository.findById(user.getRoleId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Role ID: " + user.getRoleId()));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName().toUpperCase()));
        for (String code : rolePermissionRepository.findPermissionCodesByRoleId(role.getRoleId())) {
            authorities.add(new SimpleGrantedAuthority(code));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    @Transactional
    public void processOAuthPostLogin(String email, String name, String pictureUrl) {

        Optional<User> existUser = userRepository.findByEmail(email);

        if (existUser.isEmpty()) {

            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name);

            String autoUsername = email.split("@")[0];

            if (userRepository.findByUserName(autoUsername).isPresent()) {
                autoUsername = autoUsername + "_" + System.currentTimeMillis();
            }
            newUser.setUserName(autoUsername);

            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

            newUser.setVerified(true);
            Role userRole = roleRepository.findByRoleName("USER");
            if (userRole == null) {

                throw new NotFoundException("Lỗi: Role 'USER' không tồn tại trong Database!");
            }

            newUser.setRoleId(userRole.getRoleId());
            newUser.setAvatarUrl(resolveOAuthAvatar(name, pictureUrl));

            userRepository.save(newUser);
        } else {

            User user = existUser.get();

            user.setFullName(name);
            user.setAvatarUrl(resolveOAuthAvatar(name, pictureUrl));
            userRepository.save(user);
        }
    }

    private String resolveOAuthAvatar(String name, String pictureUrl) {
        if (pictureUrl != null && !pictureUrl.isBlank()) {
            return pictureUrl;
        }
        String safeName = (name == null || name.isBlank()) ? "User" : name.trim().replace(" ", "+");
        return "https://ui-avatars.com/api/?name=" + safeName + "&background=random&color=fff";
    }

}
