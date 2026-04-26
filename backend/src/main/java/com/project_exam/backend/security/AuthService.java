package com.project_exam.backend.security;

import com.project_exam.backend.dto.auth.UserTokenInfo;
import com.project_exam.backend.dto.request.ChangePasswordRequest;
import com.project_exam.backend.dto.request.ForgotPasswordRequest;
import com.project_exam.backend.dto.request.RegisterRequest;
import com.project_exam.backend.dto.request.ResetPasswordRequest;
import com.project_exam.backend.dto.response.AuthMessageResponse;
import com.project_exam.backend.dto.response.UserResponse;
import com.project_exam.backend.models.PasswordResetToken;
import com.project_exam.backend.models.Role;
import com.project_exam.backend.models.User;
import com.project_exam.backend.repositories.EmailVerificationRepository;
import com.project_exam.backend.repositories.PasswordResetTokenRepository;
import com.project_exam.backend.repositories.RoleRepository;
import com.project_exam.backend.repositories.UserRepository;
import com.project_exam.backend.config.CustomUserDetailsService;
import com.project_exam.backend.services.EmailVerificationService;
import com.project_exam.backend.util.EmailUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final EmailVerificationService emailVerificationService;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailUtil emailUtil;
    
    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    public UserResponse login(String identifier, String password, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, password)
        );

        User user = userRepository.findByUserName(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.getVerified()) {
            throw new RuntimeException("Tài khoản chưa xác thực email");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(identifier);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("roleId", user.getRoleId());

        String accessToken = jwtService.generateToken(userDetails, claims);
        setAccessTokenCookie(accessToken, response);

        return new UserResponse(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getRoleId(),
                user.getAvatarUrl()
        );
    }

    public Map<String, Object> refresh(String refreshToken, HttpServletResponse response) {
        String username = jwtService.extractUsername(refreshToken);
        if (username == null || !jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Refresh token hết hạn hoặc không hợp lệ");
        }

        User user = userRepository.findByUserName(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("roleId", user.getRoleId());

        String newAccessToken = jwtService.generateToken(userDetails, claims);
        setAccessTokenCookie(newAccessToken, response);

        return Map.of("message", "Cấp access token mới thành công");
    }

    public void logout(HttpServletResponse response) {
        boolean isSecure = frontendOrigin != null && frontendOrigin.startsWith("https");
        String sameSiteAttr = isSecure ? "; SameSite=None; Secure" : "; SameSite=Lax";
        
        response.addHeader("Set-Cookie", buildAccessTokenCookie("", 0));
        response.addHeader("Set-Cookie", "JSESSIONID=; HttpOnly; Path=/; Max-Age=0" + sameSiteAttr);
        response.addHeader("Set-Cookie", "XSRF-TOKEN=; Path=/; Max-Age=0" + sameSiteAttr);
    }

    private void setAccessTokenCookie(String accessToken, HttpServletResponse response) {
        String encodedToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        int cookieMax = (int) ((jwtService.extractClaim(accessToken, Claims::getExpiration).getTime() - System.currentTimeMillis()) / 1000);
        if (cookieMax <= 0) cookieMax = 3600;
        response.addHeader("Set-Cookie", buildAccessTokenCookie(encodedToken, cookieMax));
    }

    private String buildAccessTokenCookie(String cookieValue, int cookieMaxAge) {
        boolean isSecure = frontendOrigin != null && frontendOrigin.startsWith("https");
        
        StringBuilder sb = new StringBuilder();
        sb.append("accessToken=").append(cookieValue)
          .append("; HttpOnly; Path=/; Max-Age=").append(cookieMaxAge);
        
        if (isSecure) {
            sb.append("; SameSite=None; Secure");
        } else {
            sb.append("; SameSite=Lax");
        }
        return sb.toString();
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.findByUserName(request.getUserName()).isPresent())
            throw new RuntimeException("Tên đăng nhập đã tồn tại");

        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        if (existing.isPresent()) {
            User existUser = existing.get();
            if (existUser.getVerified()) throw new RuntimeException("Email đã được sử dụng");
            emailVerificationRepository.deleteByUserId(existUser.getUserId());
            userRepository.delete(existUser);
        }

        User user = new User();
        user.setUserName(request.getUserName());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setVerified(false);
        user.setAvatarUrl("https://ui-avatars.com/api/?name=" + request.getUserName() + "&background=random&color=fff");

        Role userRole = roleRepository.findByRoleName("USER");
        user.setRoleId(userRole.getRoleId());
        userRepository.save(user);

        try {
            emailVerificationService.createVerification(user);
        } catch (Exception e) {
            userRepository.delete(user);
            throw new RuntimeException("Không thể gửi email xác thực.");
        }
        return Map.of("message", "Đăng ký thành công! Vui lòng kiểm tra email.");
    }

    // Các hàm phụ trợ khác giữ nguyên logic của bạn...
    public UserResponse me(HttpServletRequest request) {
        Claims claims = jwtService.extractAllClaimsFromRequest(request);
        User user = userRepository.findById((String) claims.get("userId")).orElseThrow();
        return new UserResponse(user.getUserId(), user.getUserName(), user.getEmail(), user.getRoleId(), user.getAvatarUrl());
    }
    
    public UserTokenInfo getCurrentUserInfo(HttpServletRequest request) {
        try {
            Claims claims = jwtService.extractAllClaimsFromRequest(request);
            return new UserTokenInfo((String) claims.get("userId"), (String) claims.get("roleId"));
        } catch (Exception e) {
            throw new RuntimeException("Không thể xác định thông tin người dùng.");
        }
    }

    public AuthMessageResponse forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            passwordResetTokenRepository.deleteByUserId(user.getUserId());
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUserId(user.getUserId());
            resetToken.setToken(token);
            resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
            resetToken.setUsed(false);
            passwordResetTokenRepository.save(resetToken);
            emailUtil.sendResetPasswordEmail(user.getEmail(), token);
        }
        return new AuthMessageResponse("Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.");
    }

    public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
        validateNewPassword(request.getNewPassword(), request.getConfirmNewPassword());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken()).orElseThrow(() -> new RuntimeException("Token không hợp lệ"));
        if (Boolean.TRUE.equals(resetToken.getUsed()) || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Token hết hạn hoặc đã dùng");
        User user = userRepository.findById(resetToken.getUserId()).orElseThrow();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        return new AuthMessageResponse("Đặt lại mật khẩu thành công");
    }

    public AuthMessageResponse changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        validateNewPassword(request.getNewPassword(), request.getConfirmNewPassword());
        User user = userRepository.findById(getCurrentUserInfo(httpRequest).getUserId()).orElseThrow();
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) throw new RuntimeException("Mật khẩu cũ không đúng");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logout(httpResponse);
        return new AuthMessageResponse("Đổi mật khẩu thành công");
    }

    private void validateNewPassword(String newPassword, String confirmNewPassword) {
        if (!Objects.equals(newPassword, confirmNewPassword)) throw new RuntimeException("Mật khẩu xác nhận không khớp");
        if (newPassword.length() < 6) throw new RuntimeException("Mật khẩu ít nhất 6 ký tự");
    }
}