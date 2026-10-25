package com.project_exam.backend.modules.assessment.attempt.util;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.test.domain.Test;

import java.time.Duration;
import java.time.Instant;

public final class AttemptTimeUtil {

    public static final long GRACE_SECONDS = 60;

    private AttemptTimeUtil() {
    }

    // Hạn nộp = giờ hết giờ trên đồng hồ cộng thời gian ân hạn (để kịp gửi request lúc tự nộp).
    public static Instant deadline(UserTest userTest, Test test) {
        Instant end = scheduledEnd(userTest, test);
        return end == null ? null : end.plusSeconds(GRACE_SECONDS);
    }

    // Giờ hết giờ = mốc sớm hơn giữa (bắt đầu + thời lượng) và giờ đóng đề, chưa cộng ân hạn.
    // Khớp với cách frontend tính đồng hồ, để bắt đầu sát giờ đóng đề không làm quá availableTo được.
    public static Instant scheduledEnd(UserTest userTest, Test test) {
        if (userTest == null || userTest.isPractice() || test == null) {
            return null;
        }
        Integer durationMinutes = test.getDurationMinutes();
        Instant byDuration = durationMinutes != null && durationMinutes > 0 && userTest.getStartedAt() != null
                ? userTest.getStartedAt().plus(Duration.ofMinutes(durationMinutes))
                : null;
        Instant availableTo = test.getAvailableTo();

        Instant deadline;
        if (byDuration == null) {
            deadline = availableTo;
        } else if (availableTo == null) {
            deadline = byDuration;
        } else {
            deadline = byDuration.isBefore(availableTo) ? byDuration : availableTo;
        }
        return deadline;
    }

    public static boolean isExpired(UserTest userTest, Test test, Instant now) {
        Instant deadline = deadline(userTest, test);
        return deadline != null && now.isAfter(deadline);
    }
}
