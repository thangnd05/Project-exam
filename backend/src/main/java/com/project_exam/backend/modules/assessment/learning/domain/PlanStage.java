package com.project_exam.backend.modules.assessment.learning.domain;

public enum PlanStage {
    /** Ôn từng tag theo Part (không trộn Part). */
    FOUNDATION,
    /** @deprecated Không còn dùng; plan cũ có thể còn giá trị này trong DB. */
    MIX,
    /** Hết ải — nhắc làm mock kiểm tra readiness. */
    MOCK
}
