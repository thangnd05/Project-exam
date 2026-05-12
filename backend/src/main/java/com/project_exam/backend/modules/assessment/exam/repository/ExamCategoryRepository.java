package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamCategoryRepository extends JpaRepository<ExamCategory, String> {
    Optional<ExamCategory> findByCode(String code);

    boolean existsByCode(String code);
}
