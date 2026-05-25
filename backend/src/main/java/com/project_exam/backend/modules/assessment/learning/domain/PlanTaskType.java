package com.project_exam.backend.modules.assessment.learning.domain;

public enum PlanTaskType {
    /** Luyện theo tag yếu — mục tiêu 50 câu (hoặc hết kho). */
    TAG,
    /** Tổng ôn Part lần 1 — 200% default_num_questions. */
    PART_CAPSTONE_1,
    /** Tổng ôn Part lần 2 — 200% default_num_questions. */
    PART_CAPSTONE_2
}
