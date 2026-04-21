package com.project_exam.backend.repositories;

import com.project_exam.backend.models.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, String> {
    Optional<EmailVerification> findByToken(String token);
    List<EmailVerification> findAllByExpiresAtBeforeAndStatus(LocalDateTime time, String status);
    void deleteByUserId(String userId);
}
