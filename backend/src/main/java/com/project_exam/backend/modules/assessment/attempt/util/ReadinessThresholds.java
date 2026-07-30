package com.project_exam.backend.modules.assessment.attempt.util;

/**
 * Ngưỡng readiness — nguồn DUY NHẤT cho cả màn kết quả (EnhancedResultService) lẫn lộ trình học.
 * Level chỉ phụ thuộc % readiness, không phụ thuộc điểm mục tiêu của user.
 */
public final class ReadinessThresholds {

    public static final int NOT_READY_MAX = 59;
    public static final int NEEDS_IMPROVEMENT_MAX = 74;
    public static final int ALMOST_READY_MAX = 84;

    private ReadinessThresholds() {
    }

    public static String levelFromScore(Integer readinessScore) {
        if (readinessScore == null) {
            return null;
        }
        if (readinessScore <= NOT_READY_MAX) {
            return "NOT_READY";
        }
        if (readinessScore <= NEEDS_IMPROVEMENT_MAX) {
            return "NEEDS_IMPROVEMENT";
        }
        if (readinessScore <= ALMOST_READY_MAX) {
            return "ALMOST_READY";
        }
        return "READY";
    }
}
