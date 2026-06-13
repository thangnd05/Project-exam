package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class LearningPlanTaskUnlockSupport {

    private final LearningPlanTaskRepository taskRepository;

    public void onTaskPassed(LearningPlanTask passedTask, String learningPlanId) {
        if (passedTask.getTaskType() == PlanTaskType.TAG) {
            tryUnlockCapstoneOne(learningPlanId, passedTask.getExamPartId());
            return;
        }
        if (passedTask.getTaskType() == PlanTaskType.PART_CAPSTONE_1) {
            activateIfLocked(learningPlanId, passedTask.getExamPartId(), PlanTaskType.PART_CAPSTONE_2);
        }
    }

    private void tryUnlockCapstoneOne(String learningPlanId, String examPartId) {
        List<LearningPlanTask> partTasks =
                taskRepository.findByLearningPlanIdAndExamPartIdOrderByTaskOrderAsc(
                        learningPlanId, examPartId);
        boolean hasTagTasks = partTasks.stream().anyMatch(t -> t.getTaskType() == PlanTaskType.TAG);
        if (hasTagTasks) {
            boolean allTagsPassed = partTasks.stream()
                    .filter(t -> t.getTaskType() == PlanTaskType.TAG)
                    .allMatch(t -> t.getStatus() == TaskStatus.PASSED);
            if (!allTagsPassed) {
                return;
            }
        }
        activateIfLocked(learningPlanId, examPartId, PlanTaskType.PART_CAPSTONE_1);
    }

    private void activateIfLocked(String learningPlanId, String examPartId, PlanTaskType type) {
        taskRepository
                .findFirstByLearningPlanIdAndExamPartIdAndTaskTypeAndStatus(
                        learningPlanId, examPartId, type, TaskStatus.LOCKED)
                .ifPresent(task -> {
                    task.setStatus(TaskStatus.ACTIVE);
                    taskRepository.save(task);
                });
    }
}
