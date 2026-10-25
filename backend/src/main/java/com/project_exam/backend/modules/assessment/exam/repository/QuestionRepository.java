package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String>, JpaSpecificationExecutor<Question> {

    List<Question> findByChapterId(String chapterId);
    List<Question> findByClassId(String classId);

    @Query(value = """
            SELECT question_id FROM assessment.questions
            WHERE exam_part_id = :examPartId AND usage_scope IN (:scopes) AND deleted_at IS NULL
            ORDER BY RANDOM() LIMIT :limit
            """,
            nativeQuery = true)
    List<String> findRandomQuestionIdsByExamPartId(
            @Param("examPartId") String examPartId,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit);

    @Query("SELECT CASE WHEN COUNT(q) > 0 THEN true ELSE false END FROM Question q "
         + "WHERE q.examPartId = :examPartId AND q.usageScope IN :scopes")
    boolean existsByExamPartId(@Param("examPartId") String examPartId,
                               @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.examPartId = :examPartId")
    long countByExamPartId(@Param("examPartId") String examPartId);

    @Query("""
        SELECT q FROM Question q
        WHERE q.classId = :classId AND q.createdBy = :createdBy
          AND q.isBank = true AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByClassIdAndCreatedByAndIsBankTrue(
            @Param("classId") String classId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT q FROM Question q
        WHERE q.classId = :classId AND q.chapterId = :chapterId AND q.createdBy = :createdBy
          AND q.isBank = true AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByClassIdAndChapterIdAndCreatedByAndIsBankTrue(
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.classId = :classId AND q.createdBy = :createdBy
          AND q.isBank = true AND q.usageScope IN :scopes
    """)
    long countByClassIdAndCreatedByAndIsBankTrue(
            @Param("classId") String classId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.classId = :classId AND q.chapterId = :chapterId AND q.createdBy = :createdBy
          AND q.isBank = true AND q.usageScope IN :scopes
    """)
    long countByClassIdAndChapterIdAndCreatedByAndIsBankTrue(
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId AND q.classId = :classId
          AND q.isBank = true AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.chapterId = :chapterId
          AND q.isBank = true AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.chapterId = :chapterId
          AND q.isBank = true AND q.usageScope IN :scopes
    """)
    long countByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("scopes") Collection<Question.UsageScope> scopes
    );

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.examPartId = :examPartId AND q.classId = :classId
          AND q.isBank = true AND q.usageScope IN :scopes
    """)
    long countByExamPartIdAndClassId(@Param("examPartId") String examPartId,
                                     @Param("classId") String classId,
                                     @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy = :createdBy
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy = :createdBy
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    long countByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findAdminBankByExamPart(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    long countAdminBankByExamPart(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    long countByCollectionId(String collectionId);

    long countByCollectionIdIn(Collection<String> collectionIds);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy = :createdBy
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    Integer findMaxQuestionNumberPersonal(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.classId = :classId
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    Integer findMaxQuestionNumberByExamPartAndClass(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.classId = :classId
          AND q.chapterId = :chapterId
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    Integer findMaxQuestionNumberByExamPartAndClassAndChapter(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    @Query(value = """
            SELECT q.question_id FROM assessment.questions q
            INNER JOIN assessment.question_tags qt ON qt.question_id = q.question_id
            WHERE qt.tag_id = :tagId AND q.exam_part_id = :examPartId AND q.deleted_at IS NULL
              AND q.usage_scope IN (:scopes)
            ORDER BY RANDOM()
            LIMIT :limit
            """, nativeQuery = true)
    List<String> findRandomQuestionIdsByTagAndExamPart(
            @Param("tagId") String tagId,
            @Param("examPartId") String examPartId,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM assessment.questions q
                INNER JOIN assessment.question_tags qt ON qt.question_id = q.question_id
                WHERE qt.tag_id = :tagId AND q.exam_part_id = :examPartId AND q.deleted_at IS NULL
                  AND q.usage_scope IN (:scopes)
            )
            """, nativeQuery = true)
    boolean existsByTagAndExamPart(
            @Param("tagId") String tagId,
            @Param("examPartId") String examPartId,
            @Param("scopes") Collection<String> scopes);
}
