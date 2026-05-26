package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningPlanSessionQuestionRepository extends JpaRepository<LearningPlanSessionQuestion, String> {

    List<LearningPlanSessionQuestion> findBySessionIdOrderByDisplayOrderAsc(String sessionId);

    void deleteBySessionIdIn(List<String> sessionIds);
}
