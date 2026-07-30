package com.project_exam.backend.modules.gamification.streak.domain;

import lombok.Getter;

@Getter
public enum StreakActivityType {
    TEST_SUBMIT(true),
    VOCAB_PRACTICE(true),
    LESSON_PASS(true);

    private final boolean enabled;

    StreakActivityType(boolean enabled) {
        this.enabled = enabled;
    }
}
