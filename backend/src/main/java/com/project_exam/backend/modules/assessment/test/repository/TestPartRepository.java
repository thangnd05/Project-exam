package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TestPartRepository extends JpaRepository<TestPart, String> {
    List<TestPart> findByTestId(String testId);
    List<TestPart> findByTestIdIn(Collection<String> testIds);
    List<TestPart> findByExamPartId(String examPartId);
    @Query("SELECT tp FROM TestPart tp LEFT JOIN ExamPart ep ON ep.examPartId = tp.examPartId "
            + "WHERE tp.testId = :testId ORDER BY COALESCE(ep.displayOrder, 999) ASC")
    List<TestPart> findByTestIdOrderByExamPartDisplayOrder(@Param("testId") String testId);
}
