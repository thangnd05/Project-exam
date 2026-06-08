package com.project_exam.backend.modules.gamification.quest.domain;

import lombok.Getter;

@Getter
public enum QuestConditionType {
    NONE("Không cần điều kiện"),
    COMPLETE_TEST("Hoàn thành bài thi"),
    STREAK_DAYS("Đạt chuỗi ngày học"),
    CREATE_LEARNING_PLAN("Tạo lộ trình học"),
    COMPLETE_LEARNING_PLAN("Hoàn thành lộ trình học");

    private final String label;

    QuestConditionType(String label) {
        this.label = label;
    }
}
