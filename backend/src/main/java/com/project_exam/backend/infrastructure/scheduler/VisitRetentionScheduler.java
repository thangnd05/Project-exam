package com.project_exam.backend.infrastructure.scheduler;

import com.project_exam.backend.modules.analytics.service.VisitTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VisitRetentionScheduler {

    private static final int RETENTION_DAYS = 90;

    private final VisitTrackingService visitTrackingService;

    @Scheduled(cron = "0 30 3 * * ?")
    public void purgeOldVisits() {
        visitTrackingService.purgeOlderThan(RETENTION_DAYS);
    }
}
