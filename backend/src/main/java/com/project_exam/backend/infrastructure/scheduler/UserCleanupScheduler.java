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

    // [TẮT XÁC THỰC EMAIL] Không còn tài khoản chờ xác thực nên bỏ job dọn user hết hạn.
    // @Scheduled(cron = "0 0 3 * * ?")
    // public void cleanExpiredUsers() {
    //     emailVerificationService.cleanExpiredVerifications();
    // }

    /** Bài có giờ quá hạn này mà vẫn IN_PROGRESS thì coi như người dùng không quay lại nữa. */
    private static final long EXPIRED_TIMED_STALE_HOURS = 6;

    /**
     * Dọn bài làm dở mỗi giờ. Hai loại phải xử lý khác nhau nên đi thành hai bước:
     * bài có giờ thì CHỐT ĐIỂM theo đáp án đã lưu (xoá là mất bài của người ta),
     * còn bài không giờ bỏ dở thì XOÁ hẳn cho khỏi phình DB.
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void cleanAbandonedTests() {
        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int finalized = userTestService.finalizeExpiredTimedAttempts(
                    EXPIRED_TIMED_STALE_HOURS, ABANDONED_BATCH_SIZE);
            if (finalized < ABANDONED_BATCH_SIZE) break;
        }

        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int deleted = userTestService.purgeAbandonedUntimed(
                    ABANDONED_UNTIMED_THRESHOLD_HOURS, ABANDONED_BATCH_SIZE);
            if (deleted < ABANDONED_BATCH_SIZE) break;
        }
    }
}

