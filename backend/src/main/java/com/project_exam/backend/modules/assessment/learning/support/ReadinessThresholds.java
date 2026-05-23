package com.project_exam.backend.modules.assessment.learning.support;

/**
 * Ngưỡng readiness level — đồng bộ với {@code EnhancedResultService#getReadinessLevel}.
 * <p>
 * Level chỉ phụ thuộc % readiness (trung bình skill trên bài chẩn đoán), không phụ thuộc
 * {@code UserTarget.targetScore}. Đổi target điểm không đổi level; Part target ảnh hưởng
 * {@code isTargetMet} / pass ải, không ảnh hưởng band này.
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
