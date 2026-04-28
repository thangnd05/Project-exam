package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, String>, JpaSpecificationExecutor<Evaluation> {

    // Lấy tất cả đánh giá theo user
    List<Evaluation> findByUserId(String userId);

    List<Evaluation> findByUserIdOrderByCreatedAtDesc(String userId);
}
