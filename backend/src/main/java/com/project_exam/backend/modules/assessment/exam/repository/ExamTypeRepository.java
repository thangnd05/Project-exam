package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, String> {

    @Query("SELECT e FROM ExamType e WHERE e.flexible IS NULL OR e.flexible = false")
    List<ExamType> findStandard();

    @Query("SELECT e FROM ExamType e WHERE e.flexible = true")
    List<ExamType> findFlexible();

    List<ExamType> findByParentId(String parentId);

    boolean existsByParentId(String parentId);

    long countByParentId(String parentId);

    @Query("SELECT COUNT(e) FROM ExamType e WHERE e.parentId IS NULL AND (e.flexible IS NULL OR e.flexible = false)")
    long countRootStandard();
}
