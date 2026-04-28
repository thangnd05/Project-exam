package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ScoringConversion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import java.util.List;

public interface ScoringConversionRepository extends JpaRepository<ScoringConversion, String> {
    Optional<ScoringConversion> findByExamTypeIdAndSkillIdAndNumCorrect(String examTypeId, String skillId, Integer numCorrect);
    List<ScoringConversion> findByExamTypeIdAndSkillId(String examTypeId, String skillId);
    List<ScoringConversion> findBySkillId(String skillId);
    List<ScoringConversion> findByExamTypeId(String examTypeId);
}
