package com.project_exam.backend.modules.assessment.attempt.dto;

/** Tổng hợp đánh giá của một đề, sắp đề điểm thấp lên đầu để admin ưu tiên cải thiện. */
public record EvaluationTestStatsResponse(
        String testId,
        String testTitle,
        Long count,
        Double averageRating,
        Long lowRatingCount
) {
}
