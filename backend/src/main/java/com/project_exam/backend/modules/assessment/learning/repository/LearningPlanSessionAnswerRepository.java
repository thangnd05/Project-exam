package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSessionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningPlanSessionAnswerRepository extends JpaRepository<LearningPlanSessionAnswer, String> {

    List<LearningPlanSessionAnswer> findBySessionId(String sessionId);

    void deleteBySessionIdIn(List<String> sessionIds);
}
