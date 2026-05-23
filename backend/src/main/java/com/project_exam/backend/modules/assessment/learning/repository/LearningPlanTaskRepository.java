package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearningPlanTaskRepository extends JpaRepository<LearningPlanTask, String> {

    List<LearningPlanTask> findByLearningPlanIdOrderByTaskOrderAsc(String learningPlanId);

    long countByLearningPlanIdAndStatus(String learningPlanId, TaskStatus status);

    Optional<LearningPlanTask> findFirstByLearningPlanIdAndStatusOrderByTaskOrderAsc(
            String learningPlanId, TaskStatus status);
}
