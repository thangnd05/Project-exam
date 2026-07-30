package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownDto;
import com.project_exam.backend.modules.assessment.attempt.dto.TagBreakdownDto;

/**
 * Điểm ưu tiên của ải — chỉ dùng làm tie-break khi sắp thứ tự ải lúc sinh lộ trình
 * (thứ tự chính là Tag.sortOrder do admin đặt). Không lưu DB, không trả ra FE.
 */
public final class PlanPrioritySupport {

    private PlanPrioritySupport() {
    }

    /** Càng sai nhiều lúc chẩn đoán và càng xa ngưỡng đạt thì điểm càng cao. Kẹp [0, 40]. */
    public static int computePriorityScore(
            TagBreakdownDto tag,
            PartBreakdownDto part,
            int passThresholdPercent) {
        int wrongCount = tag != null ? tag.getWrong() : Math.max(0, part.getWrong());
        double baselineAccuracy = tag != null ? tag.getPercentage() : part.getPercentage();
        int baselineAccuracyPercent = (int) Math.round(baselineAccuracy);

        int anchor = Math.min(20, Math.max(0, wrongCount) * 2);
        int gap = Math.max(0, passThresholdPercent - baselineAccuracyPercent);
        return Math.min(40, anchor + gap / 5);
    }
}
