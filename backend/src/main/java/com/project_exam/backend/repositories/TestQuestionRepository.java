package com.project_exam.backend.repositories;

import com.project_exam.backend.models.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, String> {
    List<TestQuestion> findByTestPartIdIn(List<String> testPartIds);
    List<TestQuestion> findByQuestionId(String questionId);

    boolean existsByQuestionIdAndTestPartId(String questionId, String testPartId);

    @Modifying
    @Query("DELETE FROM TestQuestion tq WHERE tq.testPartId = :testPartId")
    void deleteByTestPartId(@Param("testPartId") String testPartId);

    List<TestQuestion> findByTestPartId(String testPartId);
}
