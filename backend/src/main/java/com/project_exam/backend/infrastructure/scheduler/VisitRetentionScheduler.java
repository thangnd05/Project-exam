package com.project_exam.backend.infrastructure.scheduler;

import com.project_exam.backend.modules.analytics.service.VisitTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dọn bảng page_visits định kỳ: mỗi lần đổi route FE ghi 1 dòng nên bảng phình rất nhanh.
 * Giữ lại {@value #RETENTION_DAYS} ngày gần nhất (đủ cho mọi biểu đồ dashboard/analytics).
 */
@Component
@RequiredArgsConstructor
public class VisitRetentionScheduler {

    private static final int RETENTION_DAYS = 90;

    private final VisitTrackingService visitTrackingService;

    @Scheduled(cron = "0 30 3 * * ?") // Mỗi ngày 3h30 sáng (sau job dọn user lúc 3h)
    public void purgeOldVisits() {
        visitTrackingService.purgeOlderThan(RETENTION_DAYS);
    }
}
