package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationTestStatsResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, String>, JpaSpecificationExecutor<Evaluation> {

    List<Evaluation> findByUserId(String userId);

    boolean existsByUserIdAndTestId(String userId, String testId);

    @Query("SELECT new com.project_exam.backend.modules.assessment.attempt.dto.EvaluationTestStatsResponse("
            + "e.testId, t.title, COUNT(e), AVG(e.rating), "
            + "SUM(CASE WHEN e.rating <= 2 THEN 1L ELSE 0L END)) "
            + "FROM Evaluation e JOIN Test t ON t.testId = e.testId "
            + "GROUP BY e.testId, t.title "
            + "ORDER BY AVG(e.rating) ASC, COUNT(e) DESC")
    List<EvaluationTestStatsResponse> findStatsByTest();
}
