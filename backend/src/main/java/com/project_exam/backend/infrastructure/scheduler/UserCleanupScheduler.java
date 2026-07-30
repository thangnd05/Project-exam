package com.project_exam.backend.infrastructure.scheduler;

import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.modules.users.user.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserCleanupScheduler {

    private static final long ABANDONED_UNTIMED_THRESHOLD_HOURS = 24;

    private static final int ABANDONED_BATCH_SIZE = 500;

    private static final int ABANDONED_MAX_BATCHES_PER_RUN = 20;

    private final EmailVerificationService emailVerificationService;
    private final UserTestService userTestService;

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanExpiredUsers() {
        emailVerificationService.cleanExpiredVerifications();
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void cleanAbandonedUntimedTests() {
        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int deleted = userTestService.purgeAbandonedUntimed(
                    ABANDONED_UNTIMED_THRESHOLD_HOURS, ABANDONED_BATCH_SIZE);
            if (deleted < ABANDONED_BATCH_SIZE) break;
        }
    }
}

