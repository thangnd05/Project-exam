package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningPlanPhaseRepository extends JpaRepository<LearningPlanPhase, String> {

    List<LearningPlanPhase> findByLearningPlanIdOrderByPhaseOrderAsc(String learningPlanId);

    @Modifying
    @Query("DELETE FROM LearningPlanPhase p WHERE p.learningPlanId = :learningPlanId")
    void deleteByLearningPlanId(@Param("learningPlanId") String learningPlanId);
}
