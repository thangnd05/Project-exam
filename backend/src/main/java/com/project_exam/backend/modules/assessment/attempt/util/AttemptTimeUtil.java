package com.project_exam.backend.modules.assessment.attempt.util;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;

import java.time.Duration;
import java.time.Instant;

public final class AttemptTimeUtil {

    public static final long GRACE_SECONDS = 60;

    private AttemptTimeUtil() {
    }

    public static Instant deadline(UserTest userTest, Integer durationMinutes) {
        if (userTest == null || userTest.isPractice()) {
            return null;
        }
        if (durationMinutes == null || durationMinutes <= 0) {
            return null;
        }
        if (userTest.getStartedAt() == null) {
            return null;
        }
        return userTest.getStartedAt()
                .plus(Duration.ofMinutes(durationMinutes))
                .plusSeconds(GRACE_SECONDS);
    }

    public static boolean isExpired(UserTest userTest, Integer durationMinutes, Instant now) {
        Instant deadline = deadline(userTest, durationMinutes);
        return deadline != null && now.isAfter(deadline);
    }
}
