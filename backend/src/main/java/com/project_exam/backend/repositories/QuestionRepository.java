package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {
    List<Question> findByExamPartId(String examPartId);
    List<Question> findByPassageId(String passageId);

    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByExamPart(@Param("examPartId") String examPartId, @Param("limit") int limit);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId ORDER BY function('RAND')")
    List<Question> findRandomQuestionsByExamPartId(@Param("examPartId") String examPartId, Pageable pageable);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.examPartId = :examPartId")
    long countByExamPartId(@Param("examPartId") String examPartId);

    // Random 1 câu (để kiểm tra có passage hay không)
    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestion(@Param("examPartId") String examPartId);

    // ✅ Bổ sung các hàm có lọc theo classId
    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId AND class_id = :classId ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestionByClass(@Param("examPartId") String examPartId, @Param("classId") String classId);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.isBank = true ORDER BY function('RAND')")
    List<Question> findRandomQuestionsByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.passageId = :passageId AND q.classId = :classId")
    List<Question> findByPassageIdAndClassId(@Param("passageId") String passageId, @Param("classId") String classId);

    // ========== Kho theo lớp/chapter, KHÔNG cần examPartId ==========
    List<Question> findByClassIdAndCreatedByAndIsBankTrue(String classId, String createdBy);

    List<Question> findByClassIdAndChapterIdAndCreatedByAndIsBankTrue(String classId, String chapterId, String createdBy);

    long countByClassIdAndCreatedByAndIsBankTrue(String classId, String createdBy);

    long countByClassIdAndChapterIdAndCreatedByAndIsBankTrue(String classId, String chapterId, String createdBy);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.isBank = true")
    List<Question> findByExamPartIdAndClassId(@Param("examPartId") String examPartId, @Param("classId") String classId);

    @Query("SELECT q FROM Question q WHERE q.examPartId = :examPartId AND q.classId = :classId AND q.chapterId = :chapterId AND q.isBank = true")
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
        ORDER BY function('RAND')
    """)
    List<Question> findRandomQuestionsByExamPartIdAndClassIdAndChapterId(
            String examPartId,
            String classId,
            String chapterId,
            Pageable pageable
    );

    // ========== Cá nhân theo user đăng nhập (created_by = userId, class_id/chapter_id NULL) ==========
    List<Question> findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            String examPartId, String createdBy);

    long countByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
            String examPartId, String createdBy);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND created_by = :createdBy
          AND class_id IS NULL AND chapter_id IS NULL
          AND is_bank = true
        ORDER BY RAND() LIMIT :limit
        """, nativeQuery = true)
    List<Question> findRandomByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("limit") int limit);
}
