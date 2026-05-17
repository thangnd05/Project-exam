package com.project_exam.backend.modules.assessment.target.repository;

import com.project_exam.backend.modules.assessment.target.domain.TargetPartRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TargetPartRequirementRepository extends JpaRepository<TargetPartRequirement, String> {
    List<TargetPartRequirement> findByExamTargetMilestoneId(String examTargetMilestoneId);

    @Modifying
    void deleteByExamTargetMilestoneId(String examTargetMilestoneId);
}
