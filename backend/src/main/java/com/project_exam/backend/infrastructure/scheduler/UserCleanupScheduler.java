package com.project_exam.backend.infrastructure.scheduler;

import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.modules.users.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserCleanupScheduler {

    // Ngưỡng coi là "bỏ dở" cho bài không giới hạn giờ (giờ). Chỉnh tại đây nếu cần.
    private static final long ABANDONED_UNTIMED_THRESHOLD_HOURS = 24;
    // Xoá theo lô để mỗi transaction luôn nhỏ (phòng khi tồn đọng nhiều bản ghi).
    private static final int ABANDONED_BATCH_SIZE = 500;
    // Trần số lô mỗi lần chạy (500 * 20 = 10k/lần). Còn dư sẽ dọn tiếp ở giờ kế tiếp.
    private static final int ABANDONED_MAX_BATCHES_PER_RUN = 20;

    private final EmailVerificationService emailVerificationService;
    private final UserTestService userTestService;

    @Scheduled(cron = "0 0 3 * * ?") // Mỗi ngày lúc 3h sáng
    public void cleanExpiredUsers() {
        emailVerificationService.cleanExpiredVerifications();
    }

    // Mỗi giờ: xoá attempt của đề KHÔNG giờ đã bỏ dở quá ngưỡng (tránh phình DB).
    // Đề có giờ không đụng tới vì đã có cơ chế tự nộp phía client.
    // Lặp từng lô (mỗi lô 1 transaction riêng) tới khi hết hoặc chạm trần số lô.
    @Scheduled(cron = "0 0 * * * ?")
    public void cleanAbandonedUntimedTests() {
        for (int i = 0; i < ABANDONED_MAX_BATCHES_PER_RUN; i++) {
            int deleted = userTestService.purgeAbandonedUntimed(
                    ABANDONED_UNTIMED_THRESHOLD_HOURS, ABANDONED_BATCH_SIZE);
            if (deleted < ABANDONED_BATCH_SIZE) break; // lô cuối / đã hết
        }
    }
}

