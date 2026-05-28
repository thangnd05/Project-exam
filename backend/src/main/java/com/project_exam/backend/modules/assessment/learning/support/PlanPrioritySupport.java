package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownDto;
import com.project_exam.backend.modules.assessment.attempt.dto.TagBreakdownDto;

/**
 * MVP priority: sai nhiều + Part càng yếu + dưới ngưỡng pass → điểm cao hơn.
 */
public final class PlanPrioritySupport {

    public static final String TIER_HIGH = "HIGH";
    public static final String TIER_MEDIUM = "MEDIUM";
    public static final String TIER_LOW = "LOW";

    private PlanPrioritySupport() {
    }

    public static int computePriorityScore(
            TagBreakdownDto tag,
            PartBreakdownDto part,
            int passThresholdPercent) {
        int wrongCount = tag != null ? tag.getWrong() : Math.max(0, part.getWrong());
        int partWeight = (int) Math.max(0, 100 - part.getPercentage()) / 10;
        int belowPass = part.getPercentage() < passThresholdPercent ? 10 : 0;
        return wrongCount * 2 + partWeight + belowPass;
    }

    /**
     * Recompute priority sau mỗi phiên học. Idempotent: gọi nhiều lần với cùng input
     * cho cùng output (không cộng dồn).
     *
     * Logic:
     *  - Đã pass → 0 (đẩy xuống tier LOW)
     *  - Chưa pass, gap giữa bestAccuracy và passAccuracy càng lớn → priority càng cao
     *  - Fail ≥3 lần LIÊN TIẾP gần đây → bonus 8 điểm (đang stuck, cần ôn lại)
     *  - Kết quả nằm trong [0, 40] để khớp tier hiện tại (HIGH ≥20, MED ≥10, LOW <10)
     */
    public static int recomputePriorityAfterSession(
            Integer wrongCountAtDiagnosis,
            int bestAccuracyPercent,
            int passAccuracyPercent,
            int consecutiveFails,
            boolean passed) {
        if (passed) {
            return 0;
        }
        int anchor = wrongCountAtDiagnosis != null
                ? Math.min(20, Math.max(0, wrongCountAtDiagnosis) * 2)
                : 10;
        int gap = Math.max(0, passAccuracyPercent - bestAccuracyPercent);
        int gapBonus = gap / 5;
        int struggleBonus = consecutiveFails >= 3 ? 8 : 0;
        return Math.min(40, anchor + gapBonus + struggleBonus);
    }

    public static String tierFromScore(int priorityScore) {
        if (priorityScore >= 20) {
            return TIER_HIGH;
        }
        if (priorityScore >= 10) {
            return TIER_MEDIUM;
        }
        return TIER_LOW;
    }
}
