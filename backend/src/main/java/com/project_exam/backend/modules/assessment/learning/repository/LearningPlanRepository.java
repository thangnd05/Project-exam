package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPlanRepository extends JpaRepository<LearningPlan, String> {

    List<LearningPlan> findByUserIdAndExamTypeIdOrderByCreatedAtDesc(String userId, String examTypeId);

    Optional<LearningPlan> findTopByUserIdAndExamTypeIdAndStatusOrderByCreatedAtDesc(
            String userId, String examTypeId, LearningPlan.Status status);

    List<LearningPlan> findByUserIdAndExamTypeIdAndStatus(
            String userId, String examTypeId, LearningPlan.Status status);

    long countByUserIdAndExamTypeId(String userId, String examTypeId);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, LearningPlan.Status status);
}
