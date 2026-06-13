package com.project_exam.backend.infrastructure.scheduler;

import com.project_exam.backend.modules.users.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserCleanupScheduler {

    private final EmailVerificationService emailVerificationService;

    @Scheduled(cron = "0 0 3 * * ?") // Mỗi ngày lúc 3h sáng
    public void cleanExpiredUsers() {
        emailVerificationService.cleanExpiredVerifications();
    }
}

