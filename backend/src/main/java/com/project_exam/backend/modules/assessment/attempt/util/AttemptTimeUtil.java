package com.project_exam.backend.modules.assessment.attempt.util;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;

import java.time.Duration;
import java.time.Instant;

/**
 * Tính hạn nộp phía server cho bài CÓ giới hạn giờ, để chặn gian lận
 * "mở đề rồi tra đáp án nhiều giờ rồi mới sửa/nộp".
 *
 * <p>Deadline = {@code startedAt + durationMinutes + GRACE}. Bài luyện tập (PRACTICE)
 * hoặc đề không đặt {@code durationMinutes} thì không có hạn (trả về {@code null}).
 */
public final class AttemptTimeUtil {

    /** Ân hạn cho lệch đồng hồ client-server và độ trễ của lần lưu/nộp cuối. */
    public static final long GRACE_SECONDS = 60;

    private AttemptTimeUtil() {
    }

    /** Hạn nộp của attempt, hoặc {@code null} nếu bài không giới hạn giờ. */
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

    /** True nếu đề có giờ và đã quá hạn (kèm ân hạn) tại thời điểm {@code now}. */
    public static boolean isExpired(UserTest userTest, Integer durationMinutes, Instant now) {
        Instant deadline = deadline(userTest, durationMinutes);
        return deadline != null && now.isAfter(deadline);
    }
}
