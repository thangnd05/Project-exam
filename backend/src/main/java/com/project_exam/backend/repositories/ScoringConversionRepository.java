package com.project_exam.backend.repositories;

import com.project_exam.backend.models.ScoringConversion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import java.util.List;

public interface ScoringConversionRepository extends JpaRepository<ScoringConversion, String> {
    Optional<ScoringConversion> findByExamTypeIdAndSkillIdAndNumCorrect(String examTypeId, String skillId, Integer numCorrect);
    List<ScoringConversion> findByExamTypeIdAndSkillId(String examTypeId, String skillId);
}
