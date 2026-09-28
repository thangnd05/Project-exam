package com.project_exam.backend.modules.auth.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.UnauthorizedException;

import com.project_exam.backend.modules.auth.dto.ChangePasswordRequest;
import com.project_exam.backend.modules.auth.dto.ForgotPasswordRequest;
import com.project_exam.backend.modules.auth.dto.RegisterRequest;
import com.project_exam.backend.modules.auth.dto.ResetPasswordRequest;
import com.project_exam.backend.modules.auth.dto.ResetTokenStatusResponse;
import com.project_exam.backend.modules.auth.dto.AuthMessageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.mapper.UserMapper;
import com.project_exam.backend.modules.auth.domain.PasswordResetToken;
import com.project_exam.backend.modules.auth.repository.EmailVerificationRepository;
import com.project_exam.backend.modules.auth.repository.PasswordResetTokenRepository;
import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.infrastructure.security.CustomUserDetailsService;
import com.project_exam.backend.infrastructure.security.JwtService;
import com.project_exam.backend.infrastructure.security.RecaptchaService;
import com.project_exam.backend.infrastructure.security.RefreshTokenStore;
import com.project_exam.backend.modules.system.mail.domain.MailTemplateCode;
import com.project_exam.backend.modules.system.mail.service.MailService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long RESET_TOKEN_EXPIRE_MINUTES = 30;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserMapper userMapper;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;
    private final RecaptchaService recaptchaService;
    private final RefreshTokenStore refreshTokenStore;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    public UserResponse login(String identifier, String password, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, password)
        );

        User user = userRepository.findByUserName(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        // [TẮT XÁC THỰC EMAIL] Không chặn đăng nhập theo cờ verified nữa.
        // if (!user.getVerified()) {
        //     throw new UnauthorizedException("Tài khoản chưa xác thực email");
        // }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(identifier);

        String familyId = UUID.randomUUID().toString();
        String jti = UUID.randomUUID().toString();
        refreshTokenStore.createFamily(user.getUserId(), familyId, jti);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("fid", familyId);

        String accessToken = jwtService.generateToken(userDetails, claims);
        String refreshToken = jwtService.generateRefreshToken(userDetails, familyId, jti);
        setAccessTokenCookie(accessToken, response);
        setRefreshTokenCookie(refreshToken, response);

        return enrichWithRoleAndPermissions(userMapper.toResponse(user), user.getRoleId());
    }

    private UserResponse enrichWithRoleAndPermissions(UserResponse response, String roleId) {
        if (roleId != null) {
            Role role = roleRepository.findById(roleId).orElse(null);
            response.setRoleName(role != null ? role.getRoleName() : null);
            response.setPermissions(rolePermissionRepository.findPermissionCodesByRoleId(roleId));
        }
        return response;
    }

    public AuthMessageResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Không tìm thấy refresh token");
        }

        String username = jwtService.extractUsername(refreshToken);
        if (username == null || !jwtService.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new UnauthorizedException("Refresh token hết hạn hoặc không hợp lệ");
        }

        String familyId = jwtService.extractFamilyId(refreshToken);
        String oldJti = jwtService.extractJti(refreshToken);
        if (familyId == null || oldJti == null) {
            throw new UnauthorizedException("Refresh token thiếu thông tin phiên");
        }

        User user = userRepository.findByUserName(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new NotFoundException("User not found"));

        String effectiveJti = refreshTokenStore.rotate(user.getUserId(), familyId, oldJti);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("fid", familyId);

        String newAccessToken = jwtService.generateToken(userDetails, claims);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, familyId, effectiveJti);
        setAccessTokenCookie(newAccessToken, response);
        setRefreshTokenCookie(newRefreshToken, response);

        return AuthMessageResponse.builder().message("Cấp access token mới thành công").build();
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {

        try {
            Claims claims = jwtService.extractAllClaimsFromRequest(request);
            String userId = (String) claims.get("userId");
            String familyId = (String) claims.get("fid");
            if (userId != null && familyId != null) {
                refreshTokenStore.revokeFamily(userId, familyId);
            }
        } catch (Exception ignored) {

        }

        boolean isSecure = frontendOrigin != null && frontendOrigin.startsWith("https");
        String sameSiteAttr = isSecure ? "; SameSite=None; Secure" : "; SameSite=Lax";

        response.addHeader("Set-Cookie", buildAccessTokenCookie("", 0));
        response.addHeader("Set-Cookie", buildRefreshTokenCookie("", 0));
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

    private void setRefreshTokenCookie(String refreshToken, HttpServletResponse response) {
        String encodedToken = URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);
        int cookieMax = (int) ((jwtService.extractClaim(refreshToken, Claims::getExpiration).getTime()
                - System.currentTimeMillis()) / 1000);
        if (cookieMax <= 0) cookieMax = 7 * 24 * 3600;
        response.addHeader("Set-Cookie", buildRefreshTokenCookie(encodedToken, cookieMax));
    }

    private String buildRefreshTokenCookie(String cookieValue, int cookieMaxAge) {
        boolean isSecure = frontendOrigin != null && frontendOrigin.startsWith("https");

        StringBuilder sb = new StringBuilder();
        sb.append("refreshToken=").append(cookieValue)
          .append("; HttpOnly; Path=/api/auth/refresh; Max-Age=").append(cookieMaxAge);

        if (isSecure) {
            sb.append("; SameSite=None; Secure");
        } else {
            sb.append("; SameSite=Lax");
        }
        return sb.toString();
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (var cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    @Transactional
    public AuthMessageResponse register(RegisterRequest request) {
        recaptchaService.verify(request.getRecaptchaToken());

        if (userRepository.findByUserName(request.getUserName()).isPresent())
            throw new ConflictException("Tên đăng nhập đã tồn tại");

        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        if (existing.isPresent()) {
            User existUser = existing.get();
            if (existUser.getVerified()) throw new ConflictException("Email đã được sử dụng");
            emailVerificationRepository.deleteByUserId(existUser.getUserId());
            userRepository.delete(existUser);
        }

        User user = new User();
        user.setUserName(request.getUserName());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(Instant.now());
        // [TẮT XÁC THỰC EMAIL] Tài khoản active ngay khi đăng ký, không cần bấm link trong mail.
        user.setVerified(true);
        // user.setVerified(false);
        user.setAvatarUrl("https://ui-avatars.com/api/?name=" + request.getUserName() + "&background=random&color=fff");

        Role userRole = roleRepository.findByRoleName("USER");
        user.setRoleId(userRole.getRoleId());
        userRepository.save(user);

        // [TẮT XÁC THỰC EMAIL] Không gửi mail xác thực nữa.
        // try {
        //     emailVerificationService.createVerification(user);
        // } catch (Exception e) {
        //     userRepository.delete(user);
        //     throw new BadRequestException("Không thể gửi email xác thực.");
        // }

        mailService.sendAuto(MailTemplateCode.WELCOME_REGISTER, user.getEmail(), user.getUserId(),
                Map.of(
                        "fullName", user.getFullName(),
                        "userName", user.getUserName(),
                        "email", user.getEmail(),
                        "loginUrl", frontendOrigin + "/login"
                ));

        return AuthMessageResponse.builder()
                .message("Đăng ký thành công! Bạn có thể đăng nhập ngay.")
                .build();
    }

    public UserResponse me(HttpServletRequest request) {
        Claims claims = jwtService.extractAllClaimsFromRequest(request);
        User user = userRepository.findById((String) claims.get("userId")).orElseThrow();
        return enrichWithRoleAndPermissions(userMapper.toResponse(user), user.getRoleId());
    }

    public String getCurrentUserId(HttpServletRequest request) {
        try {
            Claims claims = jwtService.extractAllClaimsFromRequest(request);
            return (String) claims.get("userId");
        } catch (Exception e) {
            throw new UnauthorizedException("Không thể xác định thông tin người dùng.");
        }
    }

    @Transactional
    public AuthMessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        Optional<User> userOptional = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(email.toLowerCase()));
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Moi user chi giu dung mot token con hieu luc -> gui lai se vo hieu hoa link cu.
            passwordResetTokenRepository.deleteByUserId(user.getUserId());

            String rawToken = generateResetToken();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUserId(user.getUserId());
            resetToken.setToken(hashResetToken(rawToken));
            resetToken.setExpiresAt(Instant.now().plus(Duration.ofMinutes(RESET_TOKEN_EXPIRE_MINUTES)));
            resetToken.setUsed(false);
            passwordResetTokenRepository.save(resetToken);

            mailService.sendAuto(MailTemplateCode.RESET_PASSWORD, user.getEmail(), user.getUserId(),
                    Map.of(
                            "fullName", user.getFullName(),
                            "actionUrl", frontendOrigin + "/reset?token=" + rawToken,
                            "expireMinutes", String.valueOf(RESET_TOKEN_EXPIRE_MINUTES)
                    ));
        }
        // Luon tra cung mot thong diep de khong lo email nao dang ton tai trong he thong.
        return AuthMessageResponse.builder()
                .message("N\u1ebfu email t\u1ed3n t\u1ea1i, ch\u00fang t\u00f4i \u0111\u00e3 g\u1eedi li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u.")
                .build();
    }

    /** Kiem tra token truoc khi hien thi form dat lai mat khau. */
    public ResetTokenStatusResponse checkResetToken(String token) {
        if (token == null || token.isBlank()) {
            return ResetTokenStatusResponse.builder().valid(false).reason("MISSING").build();
        }

        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByToken(hashResetToken(token));
        if (found.isEmpty()) {
            return ResetTokenStatusResponse.builder().valid(false).reason("INVALID").build();
        }

        PasswordResetToken resetToken = found.get();
        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            return ResetTokenStatusResponse.builder().valid(false).reason("USED").build();
        }
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            return ResetTokenStatusResponse.builder().valid(false).reason("EXPIRED").build();
        }

        String maskedEmail = userRepository.findById(resetToken.getUserId())
                .map(user -> maskEmail(user.getEmail()))
                .orElse(null);

        return ResetTokenStatusResponse.builder()
                .valid(true)
                .maskedEmail(maskedEmail)
                .expiresInSeconds(Math.max(0, Duration.between(Instant.now(), resetToken.getExpiresAt()).getSeconds()))
                .build();
    }

    @Transactional
    public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
        validateNewPassword(request.getNewPassword(), request.getConfirmNewPassword());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(hashResetToken(request.getToken()))
                .orElseThrow(() -> new BadRequestException("Li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u kh\u00f4ng h\u1ee3p l\u1ec7"));
        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new BadRequestException("Li\u00ean k\u1ebft n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng. Vui l\u00f2ng y\u00eau c\u1ea7u li\u00ean k\u1ebft m\u1edbi.");
        }
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Li\u00ean k\u1ebft \u0111\u00e3 h\u1ebft h\u1ea1n. Vui l\u00f2ng y\u00eau c\u1ea7u li\u00ean k\u1ebft m\u1edbi.");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new BadRequestException("Li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u kh\u00f4ng h\u1ee3p l\u1ec7"));
        if (user.getPassword() != null && passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("M\u1eadt kh\u1ea9u m\u1edbi ph\u1ea3i kh\u00e1c m\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenStore.revokeAllForUser(user.getUserId());
        notifyPasswordChanged(user);
        return AuthMessageResponse.builder()
                .message("\u0110\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng")
                .build();
    }

    public AuthMessageResponse changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        validateNewPassword(request.getNewPassword(), request.getConfirmNewPassword());
        User user = userRepository.findById(getCurrentUserId(httpRequest)).orElseThrow();
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) throw new BadRequestException("Mật khẩu cũ không đúng");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenStore.revokeAllForUser(user.getUserId());
        logout(httpRequest, httpResponse);
        notifyPasswordChanged(user);
        return AuthMessageResponse.builder().message("Đổi mật khẩu thành công").build();
    }

    private void notifyPasswordChanged(User user) {
        mailService.sendAuto(MailTemplateCode.PASSWORD_CHANGED, user.getEmail(), user.getUserId(),
                Map.of(
                        "fullName", user.getFullName(),
                        "changedAt", mailService.formatDateTime(Instant.now())
                ));
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Token chi luu duoi dang bam, ro ri DB cung khong dung lai duoc. */
    private String hashResetToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Khong tim thay thuat toan SHA-256", e);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return null;
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String masked = name.length() <= 2
                ? name.charAt(0) + "*"
                : name.charAt(0) + "*".repeat(Math.min(name.length() - 2, 5)) + name.charAt(name.length() - 1);
        return masked + "@" + parts[1];
    }

    private void validateNewPassword(String newPassword, String confirmNewPassword) {
        if (!Objects.equals(newPassword, confirmNewPassword)) throw new BadRequestException("Mật khẩu xác nhận không khớp");
        // Kh\u00f4ng \u00e9p \u0111\u1ed9 d\u00e0i t\u1ed1i thi\u1ec3u, gi\u1ed1ng l\u00fac \u0111\u0103ng k\u00fd. Ch\u1ec9 ch\u1eb7n tr\u00ean 72 k\u00fd t\u1ef1 v\u00ec BCrypt b\u1ecf qua ph\u1ea7n th\u1eeba.
        if (newPassword != null && newPassword.length() > 72) {
            throw new BadRequestException("M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u01b0\u1ee3c v\u01b0\u1ee3t qu\u00e1 72 k\u00fd t\u1ef1");
        }
    }
}
