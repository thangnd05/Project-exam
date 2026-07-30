package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSession;
import com.project_exam.backend.modules.assessment.learning.domain.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearningPlanSessionRepository extends JpaRepository<LearningPlanSession, String> {

    Optional<LearningPlanSession> findFirstByLearningPlanIdAndStatusOrderByStartedAtDesc(
            String learningPlanId, SessionStatus status);

    Optional<LearningPlanSession> findFirstByLearningPlanIdAndTaskIdAndStatusOrderByStartedAtDesc(
            String learningPlanId, String taskId, SessionStatus status);

    List<LearningPlanSession> findByLearningPlanIdAndStatus(
            String learningPlanId, SessionStatus status);

    List<LearningPlanSession> findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(
            String learningPlanId, String taskId);

    List<LearningPlanSession> findByLearningPlanId(String learningPlanId);

    void deleteByLearningPlanId(String learningPlanId);
}
