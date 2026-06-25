package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamPartRepository extends JpaRepository<ExamPart, String> {
    List<ExamPart> findByExamTypeIdOrderByDisplayOrderAscNameAsc(String examTypeId);

    default List<ExamPart> findByExamTypeId(String examTypeId) {
        return findByExamTypeIdOrderByDisplayOrderAscNameAsc(examTypeId);
    }

    @Query("""
            SELECT ep FROM ExamPart ep
            INNER JOIN ExamType et ON ep.examTypeId = et.examTypeId
            ORDER BY et.name ASC, ep.displayOrder ASC, ep.name ASC
            """)
    List<ExamPart> findAllOrdered();

    ExamPart findByName(String name);

}
