package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamPartRepository extends JpaRepository<ExamPart, String> {
    Sort DEFAULT_SORT = Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.asc("name"));

    List<ExamPart> findByExamTypeIdOrderByDisplayOrderAscNameAsc(String examTypeId);

    default List<ExamPart> findByExamTypeId(String examTypeId) {
        return findByExamTypeIdOrderByDisplayOrderAscNameAsc(examTypeId);
    }

    default List<ExamPart> findAllOrdered() {
        return findAll(DEFAULT_SORT);
    }

    ExamPart findByName(String name);

}
