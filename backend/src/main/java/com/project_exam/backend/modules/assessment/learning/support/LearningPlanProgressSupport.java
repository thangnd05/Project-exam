package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanStage;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Tiến độ lộ trình: mở khóa sau khi xong ải, bỏ qua ải trống, chuyển MOCK khi hết ải.
 */
@Component
@RequiredArgsConstructor
public class LearningPlanProgressSupport {

    private final LearningPlanRepository planRepository;
    private final LearningPlanTaskRepository taskRepository;
    private final LearningPlanTaskUnlockSupport taskUnlockSupport;
    private final QuestionRepository questionRepository;

    /** Sau khi PASSED/SKIPPED một ải: mở khóa → bỏ qua ải trống kế tiếp → có thể sang MOCK. */
    public void afterTaskCleared(LearningPlan plan, LearningPlanTask clearedTask) {
        taskUnlockSupport.onTaskCleared(clearedTask, plan.getLearningPlanId());
        autoSkipEmptyActiveTasks(plan);
        maybeAdvanceToMock(plan);
    }

    /** Sửa plan cũ bị kẹt LOCKED / ải trống khi user mở lại plan. */
    public void healPlan(LearningPlan plan) {
        taskUnlockSupport.reconcileLockedTasks(plan.getLearningPlanId());
        autoSkipEmptyActiveTasks(plan);
        maybeAdvanceToMock(plan);
    }

    public void autoSkipEmptyActiveTasks(LearningPlan plan) {
        String planId = plan.getLearningPlanId();
        boolean progressed;
        do {
            progressed = false;
            List<LearningPlanTask> activeTasks = taskRepository
                    .findByLearningPlanIdAndStatusOrderByTaskOrderAsc(planId, TaskStatus.ACTIVE);
            for (LearningPlanTask active : activeTasks) {
                if (hasQuestionsForTask(active)) {
                    continue;
                }
                active.setStatus(TaskStatus.SKIPPED);
                taskRepository.save(active);
                taskUnlockSupport.onTaskCleared(active, planId);
                progressed = true;
            }
        } while (progressed);
    }

    public void maybeAdvanceToMock(LearningPlan plan) {
        if (plan.getPlanStage() == PlanStage.MOCK) {
            return;
        }
        String planId = plan.getLearningPlanId();
        long locked = taskRepository.countByLearningPlanIdAndStatus(planId, TaskStatus.LOCKED);
        if (locked > 0) {
            return;
        }
        long total = taskRepository.countByLearningPlanId(planId);
        long passed = taskRepository.countByLearningPlanIdAndStatus(planId, TaskStatus.PASSED);
        long skipped = taskRepository.countByLearningPlanIdAndStatus(planId, TaskStatus.SKIPPED);
        if (total > 0 && passed + skipped == total) {
            plan.setPlanStage(PlanStage.MOCK);
            planRepository.save(plan);
        }
    }

    /** Chỉ cần biết ải có câu hay không → EXISTS, không bốc pool (trước đây fetch tới 600 câu để test rỗng). */
    private boolean hasQuestionsForTask(LearningPlanTask task) {
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        if (taskType == PlanTaskType.TAG) {
            return questionRepository.existsByTagAndExamPart(task.getTagId(), task.getExamPartId());
        }
        return questionRepository.existsByExamPartId(task.getExamPartId());
    }
}
