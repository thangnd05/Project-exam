package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, String> {

    List<QuestionTag> findByQuestionId(String questionId);

    List<QuestionTag> findByTagId(String tagId);

    // Bulk DELETE chạy NGAY (immediate). Nếu để derived delete, Hibernate hoãn DELETE tới cuối
    // transaction và flush INSERT trước → re-insert lại cặp (question_id, tag_id) cũ gây vi phạm
    // UNIQUE(question_id, tag_id) khi sync lại tag. Xem TagService.syncQuestionTags.
    @Modifying
    @Query("DELETE FROM QuestionTag qt WHERE qt.questionId = :questionId")
    void deleteByQuestionId(@Param("questionId") String questionId);

    @Modifying
    @Query("DELETE FROM QuestionTag qt WHERE qt.tagId = :tagId")
    void deleteByTagId(@Param("tagId") String tagId);

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
