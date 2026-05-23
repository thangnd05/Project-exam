package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, String> {

    List<QuestionTag> findByQuestionId(String questionId);

    List<QuestionTag> findByTagId(String tagId);

    void deleteByQuestionId(String questionId);

    void deleteByTagId(String tagId);

    List<QuestionTag> findByQuestionIdIn(java.util.Collection<String> questionIds);

    @Query("""
            SELECT DISTINCT qt.tagId FROM QuestionTag qt
            JOIN Question q ON q.questionId = qt.questionId
            WHERE q.examPartId = :examPartId
            """)
    List<String> findDistinctTagIdsByExamPartId(@Param("examPartId") String examPartId);

    @Query("""
            SELECT DISTINCT qt.tagId FROM QuestionTag qt
            WHERE qt.questionId IN :questionIds
            """)
    List<String> findDistinctTagIdsByQuestionIdIn(@Param("questionIds") java.util.Collection<String> questionIds);

}
