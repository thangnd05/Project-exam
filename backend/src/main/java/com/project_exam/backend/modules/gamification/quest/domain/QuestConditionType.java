package com.project_exam.backend.modules.gamification.quest.domain;

import lombok.Getter;

@Getter
public enum QuestConditionType {
    NONE("Không cần điều kiện"),
    COMPLETE_TEST("Hoàn thành bài thi");

    private final String label;

    QuestConditionType(String label) {
        this.label = label;
    }
}
