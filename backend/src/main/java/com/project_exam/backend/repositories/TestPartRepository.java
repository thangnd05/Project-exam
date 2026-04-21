package com.project_exam.backend.repositories;

import com.project_exam.backend.models.TestPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestPartRepository extends JpaRepository<TestPart, String> {
    List<TestPart> findByTestId(String testId);
    List<TestPart> findByExamPartId(String examPartId);
}
