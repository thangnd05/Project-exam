package com.project_exam.backend.repositories;

import com.project_exam.backend.models.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, String> {
}
