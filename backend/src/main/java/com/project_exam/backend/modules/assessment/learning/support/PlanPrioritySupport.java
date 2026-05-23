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
