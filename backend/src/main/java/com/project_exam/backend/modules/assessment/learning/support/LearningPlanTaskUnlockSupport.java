package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LearningPlanTaskUnlockSupport {

    private final LearningPlanTaskRepository taskRepository;

    /** PASSED hoặc SKIPPED đều được coi là đã xong ải (mở khóa bước tiếp theo). */
    public void onTaskCleared(LearningPlanTask clearedTask, String learningPlanId) {
        if (clearedTask.getTaskType() == PlanTaskType.TAG) {
            tryUnlockCapstoneOne(learningPlanId, clearedTask.getExamPartId());
            return;
        }
        if (clearedTask.getTaskType() == PlanTaskType.PART_CAPSTONE_1) {
            activateIfLocked(learningPlanId, clearedTask.getExamPartId(), PlanTaskType.PART_CAPSTONE_2);
        }
    }

    /**
     * Sửa plan cũ bị kẹt: tag đã SKIPPED/PASSED mà capstone vẫn LOCKED.
     * @return true nếu có thay đổi trạng thái task
     */
    public boolean reconcileLockedTasks(String learningPlanId) {
        List<LearningPlanTask> tasks =
                taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(learningPlanId);
        if (tasks.isEmpty()) {
            return false;
        }

        Map<String, List<LearningPlanTask>> byPart = tasks.stream()
                .collect(Collectors.groupingBy(
                        LearningPlanTask::getExamPartId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        boolean changed = false;
        for (Map.Entry<String, List<LearningPlanTask>> entry : byPart.entrySet()) {
            String examPartId = entry.getKey();
            List<LearningPlanTask> partTasks = entry.getValue();

            boolean hasTagTasks = partTasks.stream().anyMatch(t -> t.getTaskType() == PlanTaskType.TAG);
            boolean tagsCleared = !hasTagTasks || partTasks.stream()
                    .filter(t -> t.getTaskType() == PlanTaskType.TAG)
                    .allMatch(LearningPlanTaskUnlockSupport::isCleared);

            if (tagsCleared) {
                changed |= activateIfLocked(learningPlanId, examPartId, PlanTaskType.PART_CAPSTONE_1);
            }

            boolean capstone1Cleared = partTasks.stream()
                    .filter(t -> t.getTaskType() == PlanTaskType.PART_CAPSTONE_1)
                    .allMatch(LearningPlanTaskUnlockSupport::isCleared);
            boolean hasCapstone1 = partTasks.stream()
                    .anyMatch(t -> t.getTaskType() == PlanTaskType.PART_CAPSTONE_1);

            if (hasCapstone1 && capstone1Cleared) {
                changed |= activateIfLocked(learningPlanId, examPartId, PlanTaskType.PART_CAPSTONE_2);
            }
        }
        return changed;
    }

    private void tryUnlockCapstoneOne(String learningPlanId, String examPartId) {
        List<LearningPlanTask> partTasks =
                taskRepository.findByLearningPlanIdAndExamPartIdOrderByTaskOrderAsc(
                        learningPlanId, examPartId);
        boolean hasTagTasks = partTasks.stream().anyMatch(t -> t.getTaskType() == PlanTaskType.TAG);
        if (hasTagTasks) {
            boolean allTagsCleared = partTasks.stream()
                    .filter(t -> t.getTaskType() == PlanTaskType.TAG)
                    .allMatch(LearningPlanTaskUnlockSupport::isCleared);
            if (!allTagsCleared) {
                return;
            }
        }
        activateIfLocked(learningPlanId, examPartId, PlanTaskType.PART_CAPSTONE_1);
    }

    private boolean activateIfLocked(String learningPlanId, String examPartId, PlanTaskType type) {
        return taskRepository
                .findFirstByLearningPlanIdAndExamPartIdAndTaskTypeAndStatus(
                        learningPlanId, examPartId, type, TaskStatus.LOCKED)
                .map(task -> {
                    task.setStatus(TaskStatus.ACTIVE);
                    taskRepository.save(task);
                    return true;
                })
                .orElse(false);
    }

    public static boolean isCleared(LearningPlanTask task) {
        return task.getStatus() == TaskStatus.PASSED || task.getStatus() == TaskStatus.SKIPPED;
    }
}
