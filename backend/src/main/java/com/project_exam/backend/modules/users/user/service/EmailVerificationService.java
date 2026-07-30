package com.project_exam.backend.modules.users.user.service;

import com.project_exam.backend.shared.exception.BadRequestException;

import com.project_exam.backend.modules.auth.domain.EmailVerification;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.auth.repository.EmailVerificationRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.util.EmailUtil;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final UserRepository userRepository;
    private final EmailUtil emailUtil;

    @Transactional
    public void createVerification(User user) {

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new BadRequestException("Email đã được xác thực để sử dụng vui lòng dùng email khác để đăng ký.");
        }
        try {
            String token = UUID.randomUUID().toString();
            Instant expiry = Instant.now().plus(Duration.ofHours(24));

            EmailVerification verification = new EmailVerification();
            verification.setUserId(user.getUserId());
            verification.setToken(token);
            verification.setExpiresAt(expiry);
            verification.setStatus("PENDING");
            emailVerificationRepository.save(verification);

            emailUtil.sendVerificationEmail(user.getEmail(), token);

        } catch (Exception e) {

            emailVerificationRepository.deleteByUserId(user.getUserId());
            userRepository.deleteById(user.getUserId());
            throw new BadRequestException("Không thể gửi email xác thực. Vui lòng kiểm tra địa chỉ email.");
        }
    }

    public ResponseEntity<Map<String, Object>> verifyToken(String token) {

        EmailVerification ev = emailVerificationRepository.findByToken(token).orElse(null);

        if (ev == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Token không hợp lệ hoặc đã được sử dụng"));
        }

        User user = userRepository.findById(ev.getUserId()).orElse(null);
        if (user == null) {

            emailVerificationRepository.delete(ev);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không tìm thấy tài khoản liên kết với token này."));
        }

        if (ev.getExpiresAt().isBefore(Instant.now())) {
            ev.setStatus("EXPIRED");
            emailVerificationRepository.save(ev);

            if (!user.getVerified()) {
                userRepository.delete(user);
            }

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Liên kết xác thực đã hết hạn. Tài khoản đã bị hủy, vui lòng đăng ký lại."));
        }

        if ("VERIFIED".equals(ev.getStatus()) || user.getVerified()) {

            emailVerificationRepository.delete(ev);
            return ResponseEntity.ok(Map.of("message", "Tài khoản đã được xác thực trước đó."));
        }

        user.setVerified(true);
        userRepository.save(user);

        emailVerificationRepository.delete(ev);

        return ResponseEntity.ok(Map.of("message", " Xác thực tài khoản thành công!"));
    }

    public void cleanExpiredVerifications() {
        Instant now = Instant.now();
        List<EmailVerification> expired = emailVerificationRepository
                .findAllByExpiresAtBeforeAndStatus(now, "PENDING");

        for (EmailVerification ev : expired) {
            User user = userRepository.findById(ev.getUserId()).orElse(null);
            if (user != null && !user.getVerified()) {
                emailVerificationRepository.delete(ev);
                userRepository.delete(user);
            }
        }
    }
}
