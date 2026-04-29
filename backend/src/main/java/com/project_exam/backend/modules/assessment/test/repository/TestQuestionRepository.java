package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, String> {
    List<TestQuestion> findByTestPartIdIn(List<String> testPartIds);

    @Query("""
            SELECT tq FROM TestQuestion tq
            WHERE tq.testPartId IN :testPartIds
            ORDER BY COALESCE(tq.displayOrder, 2147483647), tq.testQuestionId
            """)
    List<TestQuestion> findByTestPartIdInOrderByDisplayOrder(List<String> testPartIds);

    List<TestQuestion> findByQuestionId(String questionId);

    boolean existsByQuestionIdAndTestPartId(String questionId, String testPartId);

    @Modifying
    @Query("DELETE FROM TestQuestion tq WHERE tq.testPartId = :testPartId")
    void deleteByTestPartId(@Param("testPartId") String testPartId);

    List<TestQuestion> findByTestPartId(String testPartId);

    @Query("""
            SELECT tq FROM TestQuestion tq
            WHERE tq.testPartId = :testPartId
            ORDER BY COALESCE(tq.displayOrder, 2147483647), tq.testQuestionId
            """)
    List<TestQuestion> findByTestPartIdOrderByDisplayOrder(@Param("testPartId") String testPartId);

    @Query("SELECT COALESCE(MAX(tq.displayOrder), 0) FROM TestQuestion tq WHERE tq.testPartId = :testPartId")
    Integer findMaxDisplayOrderByTestPartId(@Param("testPartId") String testPartId);
}
