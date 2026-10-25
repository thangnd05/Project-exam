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

    // Lượt đề không giới hạn giờ đã làm dở: quá số ngày này chưa nộp thì chuyển sang Hết hạn.
    private static final long STALE_UNTIMED_DAYS = 7;

    private static final int ABANDONED_BATCH_SIZE = 500;

    private static final int ABANDONED_MAX_BATCHES_PER_RUN = 20;

    private final EmailVerificationService emailVerificationService;
    private final UserTestService userTestService;

    // [TẮT XÁC THỰC EMAIL] Không còn tài khoản chờ xác thực nên bỏ job dọn user hết hạn.
    // @Scheduled(cron = "0 0 3 * * ?")
    // public void cleanExpiredUsers() {
    //     emailVerificationService.cleanExpiredVerifications();
    // }

    // Nộp hộ lượt có giờ đã quá hạn nộp mà người làm bỏ đi; chạy dày để "Đang làm" không treo lâu.
    @Scheduled(cron = "0 */5 * * * ?")
    public void finalizeOverdueTests() {
        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int finalized = userTestService.finalizeExpiredTimedAttempts(ABANDONED_BATCH_SIZE);
            if (finalized < ABANDONED_BATCH_SIZE) break;
        }
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void cleanAbandonedTests() {
        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int deleted = userTestService.purgeAbandonedUntimed(
                    ABANDONED_UNTIMED_THRESHOLD_HOURS, ABANDONED_BATCH_SIZE);
            if (deleted < ABANDONED_BATCH_SIZE) break;
        }

        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int expired = userTestService.expireStaleUntimed(STALE_UNTIMED_DAYS, ABANDONED_BATCH_SIZE);
            if (expired < ABANDONED_BATCH_SIZE) break;
        }
    }
}
