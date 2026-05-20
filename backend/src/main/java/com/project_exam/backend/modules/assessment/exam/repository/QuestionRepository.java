package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {
    List<Question> findByExamPartId(String examPartId);
    List<Question> findByPassageId(String passageId);
    List<Question> findByChapterId(String chapterId);
    List<Question> findByClassId(String classId);

    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByExamPart(@Param("examPartId") String examPartId, @Param("limit") int limit);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId ORDER BY function('RANDOM')")
    List<Question> findRandomQuestionsByExamPartId(@Param("examPartId") String examPartId, Pageable pageable);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.examPartId = :examPartId")
    long countByExamPartId(@Param("examPartId") String examPartId);

    // Random 1 câu (để kiểm tra có passage hay không)
    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestion(@Param("examPartId") String examPartId);

    //  Bổ sung các hàm có lọc theo classId
    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId AND class_id = :classId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestionByClass(@Param("examPartId") String examPartId, @Param("classId") String classId);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.isBank = true ORDER BY function('RANDOM')")
    List<Question> findRandomQuestionsByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.passageId = :passageId AND q.classId = :classId")
    List<Question> findByPassageIdAndClassId(@Param("passageId") String passageId, @Param("classId") String classId);

    // ========== Kho theo lớp/chapter, KHÔNG cần examPartId ==========
    @Query("SELECT q FROM Question q WHERE q.classId = :classId AND q.createdBy = :createdBy AND q.isBank = true ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC")
    List<Question> findByClassIdAndCreatedByAndIsBankTrue(@Param("classId") String classId, @Param("createdBy") String createdBy);

    @Query("SELECT q FROM Question q WHERE q.classId = :classId AND q.chapterId = :chapterId AND q.createdBy = :createdBy AND q.isBank = true ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC")
    List<Question> findByClassIdAndChapterIdAndCreatedByAndIsBankTrue(@Param("classId") String classId, @Param("chapterId") String chapterId, @Param("createdBy") String createdBy);

    long countByClassIdAndCreatedByAndIsBankTrue(String classId, String createdBy);

    long countByClassIdAndChapterIdAndCreatedByAndIsBankTrue(String classId, String chapterId, String createdBy);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.isBank = true ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC")
    List<Question> findByExamPartIdAndClassId(@Param("examPartId") String examPartId, @Param("classId") String classId);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.chapterId = :chapterId AND q.isBank = true ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC")
    List<Question> findByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.chapterId = :chapterId AND q.isBank = true")
    long countByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId
    );

    @Query("SELECT COUNT(q) FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.isBank = true")
    long countByExamPartIdAndClassId(@Param("examPartId") String examPartId,
                                     @Param("classId") String classId);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.classId = :classId
          AND q.chapterId = :chapterId
          AND q.isBank = true
        ORDER BY function('RANDOM')
    """)
    List<Question> findRandomQuestionsByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            Pageable pageable
    );

    // ========== Cá nhân theo user đăng nhập (created_by = userId, class_id/chapter_id NULL) ==========
    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy = :createdBy
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            @Param("examPartId") String examPartId, @Param("createdBy") String createdBy);

    long countByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            String examPartId, String createdBy);

    // ========== Kho admin: do bất kỳ admin nào tạo, public cho mọi user ==========
    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
        ORDER BY q.questionNumber ASC NULLS LAST, q.createdAt ASC, q.questionId ASC
    """)
    List<Question> findAdminBankByExamPart(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds);

    @Query("""
        SELECT COUNT(q) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
    """)
    long countAdminBankByExamPart(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND created_by = :createdBy
          AND class_id IS NULL AND chapter_id IS NULL
          AND is_bank = true
        ORDER BY RANDOM() LIMIT :limit
        """, nativeQuery = true)
    List<Question> findRandomByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("limit") int limit);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND created_by = :createdBy
          AND class_id IS NULL AND chapter_id IS NULL
          AND is_bank = true
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND class_id = :classId AND is_bank = true
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialQuestionsByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND class_id = :classId AND chapter_id = :chapterId AND is_bank = true
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialQuestionsByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    long countByCollectionId(String collectionId);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy = :createdBy
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
    """)
    Integer findMaxQuestionNumberPersonal(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.classId = :classId
          AND q.chapterId IS NULL
          AND q.isBank = true
    """)
    Integer findMaxQuestionNumberByExamPartAndClass(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.classId = :classId
          AND q.chapterId = :chapterId
          AND q.isBank = true
    """)
    Integer findMaxQuestionNumberByExamPartAndClassAndChapter(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId);

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
    """)
    Integer findMaxQuestionNumberAdminBank(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds);
}
