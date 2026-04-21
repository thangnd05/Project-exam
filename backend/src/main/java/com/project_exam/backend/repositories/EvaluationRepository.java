package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, String> {

    // Lấy tất cả đánh giá theo user
    List<Evaluation> findByUserId(String userId);

    List<Evaluation> findByUserIdOrderByCreatedAtDesc(String userId);
}
