package com.project_exam.backend.modules.gamification.quest.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import com.project_exam.backend.modules.gamification.quest.domain.QuestConditionType;
import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import com.project_exam.backend.modules.gamification.streak.repository.UserStreakRepository;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

/**
 * Tính tiến độ điều kiện của 1 nhiệm vụ cho 1 user (đếm từ dữ liệu đã có).
 * Thêm loại điều kiện mới: thêm 1 nhánh trong switch.
 */
@Service
@RequiredArgsConstructor
public class QuestConditionEvaluator {

    private final UserTestRepository userTestRepository;
    private final UserStreakRepository userStreakRepository;
    private final LearningPlanRepository learningPlanRepository;

    /** Kết quả: đã đạt bao nhiêu / cần bao nhiêu, đủ điều kiện chưa. */
    @Getter
    @RequiredArgsConstructor
    public static class Progress {
        private final int current;
        private final int target;
        private final boolean satisfied;
    }

    public Progress evaluate(Quest quest, String userId) {
        QuestConditionType type = quest.getConditionType();
        int target = quest.getConditionTarget() == null ? 0 : quest.getConditionTarget();

        if (type == QuestConditionType.NONE) {
            return new Progress(0, 0, true); // cổng luôn mở
        }

        int current = switch (type) {
            case COMPLETE_TEST -> (int) userTestRepository
                    .countByUserIdAndStatus(userId, UserTest.Status.COMPLETED);
            case STREAK_DAYS -> userStreakRepository.findByUserId(userId)
                    .map(UserStreak::getLongestStreak)
                    .orElse(0);
            case CREATE_LEARNING_PLAN -> (int) learningPlanRepository.countByUserId(userId);
            case COMPLETE_LEARNING_PLAN -> (int) learningPlanRepository
                    .countByUserIdAndStatus(userId, LearningPlan.Status.COMPLETED);
            default -> 0;
        };

        return new Progress(current, target, current >= target);
    }
}
