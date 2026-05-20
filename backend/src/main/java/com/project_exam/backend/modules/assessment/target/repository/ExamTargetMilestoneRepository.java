package com.project_exam.backend.modules.assessment.target.repository;

import com.project_exam.backend.modules.assessment.target.domain.ExamTargetMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamTargetMilestoneRepository extends JpaRepository<ExamTargetMilestone, String> {
    List<ExamTargetMilestone> findByExamTypeIdOrderByCreatedAtAsc(String examTypeId);

    Optional<ExamTargetMilestone> findByExamTypeIdAndMilestoneScore(String examTypeId, Integer milestoneScore);
}
