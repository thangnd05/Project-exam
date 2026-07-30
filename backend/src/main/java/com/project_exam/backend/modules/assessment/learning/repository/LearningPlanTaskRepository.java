package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LearningPlanTaskRepository extends JpaRepository<LearningPlanTask, String> {

    List<LearningPlanTask> findByLearningPlanIdOrderByTaskOrderAsc(String learningPlanId);

    List<LearningPlanTask> findByLearningPlanIdInOrderByTaskOrderAsc(Collection<String> learningPlanIds);

    long countByLearningPlanId(String learningPlanId);

    List<LearningPlanTask> findByLearningPlanIdAndExamPartIdOrderByTaskOrderAsc(
            String learningPlanId, String examPartId);

    Optional<LearningPlanTask> findFirstByLearningPlanIdAndExamPartIdAndTaskTypeAndStatus(
            String learningPlanId,
            String examPartId,
            PlanTaskType taskType,
            TaskStatus status);

    long countByLearningPlanIdAndStatus(String learningPlanId, TaskStatus status);

    Optional<LearningPlanTask> findFirstByLearningPlanIdAndStatusOrderByTaskOrderAsc(
            String learningPlanId, TaskStatus status);

    void deleteByLearningPlanId(String learningPlanId);
}
