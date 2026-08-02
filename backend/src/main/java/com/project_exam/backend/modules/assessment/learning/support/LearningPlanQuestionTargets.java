package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;

public final class LearningPlanQuestionTargets {

    public static final int TAG_TARGET = 1;
    // public static final int TAG_TARGET = 50;

    public static final int CAPSTONE_MULTIPLIER = 2;
    public static final int DEFAULT_PART_QUESTIONS_WHEN_UNSET = 30;
    public static final int MIN_POOL_FETCH = 120;
    public static final int MAX_POOL_FETCH = 600;

    private LearningPlanQuestionTargets() {
    }

    public static int resolveCapstoneTarget(ExamPart part) {
        // Tạm: cùng TAG_TARGET để test nhanh.
        // Prod: mở lại block dưới, xóa return TAG_TARGET.
        return TAG_TARGET;
        /*
        int base = part != null && part.getDefaultNumQuestions() != null && part.getDefaultNumQuestions() > 0
                ? part.getDefaultNumQuestions()
                : DEFAULT_PART_QUESTIONS_WHEN_UNSET;
        return base * CAPSTONE_MULTIPLIER;
        */
    }

    public static int poolFetchSize(int targetCount) {
        return Math.min(MAX_POOL_FETCH, Math.max(MIN_POOL_FETCH, targetCount * 3));
    }
}
