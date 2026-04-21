package com.project_exam.backend.repositories;

import com.project_exam.backend.models.ExamPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamPartRepository extends JpaRepository<ExamPart, String> {
    List<ExamPart> findByExamTypeId(String examTypeId);

    ExamPart findByName(String name);

}
