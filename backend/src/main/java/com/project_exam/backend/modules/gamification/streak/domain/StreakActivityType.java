package com.project_exam.backend.modules.gamification.streak.domain;

import lombok.Getter;

/**
 * Catalog các loại hành động học được tính vào streak, kèm cờ bật/tắt.
 *
 * Đây là nguồn cấu hình hiện tại (fix cứng). Khi cần cho admin bật/tắt mà không
 * deploy lại, có thể thay enum này bằng bảng `streak_activity_types` mà KHÔNG phải
 * sửa các điểm hook trong code (vẫn gọi recordActivity(userId, TYPE)).
 *
 * Lưu ý: streak ("hành động nào ĐƯỢC TÍNH") độc lập với RBAC ("user có ĐƯỢC PHÉP làm gì").
 */
@Getter
public enum StreakActivityType {
    TEST_SUBMIT(true),      // nộp 1 bài test
    VOCAB_PRACTICE(true),   // luyện / đánh dấu thuộc 1 từ vựng
    LESSON_PASS(true);      // pass 1 ải trong learning plan

    /** recordActivity bỏ qua nếu type này hiện không được tính streak. */
    private final boolean enabled;

    StreakActivityType(boolean enabled) {
        this.enabled = enabled;
    }
}
