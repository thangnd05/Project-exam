package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamTypeLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamTypeLayoutRepository extends JpaRepository<ExamTypeLayout, String> {
    Optional<ExamTypeLayout> findByExamTypeId(String examTypeId);
}
