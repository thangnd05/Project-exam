package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownDto;
import com.project_exam.backend.modules.assessment.attempt.dto.TagBreakdownDto;

public final class PlanPrioritySupport {

    private PlanPrioritySupport() {
    }

    public static int computePriorityScore(
            TagBreakdownDto tag,
            PartBreakdownDto part,
            int passThresholdPercent) {
        int wrongCount = tag != null ? tag.getWrong() : Math.max(0, part.getWrong());
        double baselineAccuracy = tag != null ? tag.getPercentage() : part.getPercentage();
        int baselineAccuracyPercent = (int) Math.round(baselineAccuracy);
        return recomputePriorityAfterSession(
                wrongCount, baselineAccuracyPercent, passThresholdPercent, false);
    }

    /**
     * Điểm dùng để xếp thứ tự ải (tie-break trong cùng sortOrder). Idempotent, kẹp [0, 40].
     *
     * <p>Chỉ dựa trên độ yếu lúc chẩn đoán và khoảng cách tới ngưỡng đạt. KHÔNG đẩy ải làm
     * nhiều lần lên trước: thứ tự học do admin đặt (Tag.sortOrder), số lượt đã làm chỉ để
     * hiển thị cho người học biết, không dùng để sắp lại lộ trình.
     */
    public static int recomputePriorityAfterSession(
            Integer wrongCountAtDiagnosis,
            int bestAccuracyPercent,
            int passAccuracyPercent,
            boolean passed) {
        if (passed) {
            return 0;
        }
        int anchor = wrongCountAtDiagnosis != null
                ? Math.min(20, Math.max(0, wrongCountAtDiagnosis) * 2)
                : 10;
        int gap = Math.max(0, passAccuracyPercent - bestAccuracyPercent);
        int gapBonus = gap / 5;
        return Math.min(40, anchor + gapBonus);
    }
}
