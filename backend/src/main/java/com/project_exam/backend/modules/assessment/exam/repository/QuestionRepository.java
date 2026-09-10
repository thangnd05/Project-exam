package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

/**
 * Lưu ý về tham số {@code scopes} có mặt ở phần lớn query bên dưới:
 * mỗi query chỉ phục vụ MỘT luồng, và luồng đó quyết định bốc câu EXAM hay
 * PRACTICE. Truyền qua tham số thay vì viết cứng trong câu query để chỗ gọi
 * nói rõ nó đang lấy câu loại nào — xem
 * {@link Question.UsageScope#FOR_EXAM} và {@link Question.UsageScope#FOR_PRACTICE}.
 *
 * Mỗi {@code find*} đều có một {@code count*} song song. Sửa cái này mà quên
 * cái kia thì UI báo kho có N câu nhưng bốc ra được ít hơn — luôn sửa theo cặp.
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

    List<Question> findByExamPartId(String examPartId);
    List<Question> findByPassageId(String passageId);
    List<Question> findByChapterId(String chapterId);
    List<Question> findByClassId(String classId);

    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByExamPart(@Param("examPartId") String examPartId, @Param("limit") int limit);

    /**
     * Bốc ngẫu nhiên chỉ lấy question_id: ORDER BY RANDOM() phải sort toàn bộ câu của Part,
     * chiếu về 1 cột id để Postgres không kéo theo nội dung câu hỏi (pool tới 600 dòng/phiên).
     */
    @Query(value = """
            SELECT question_id FROM questions
            WHERE exam_part_id = :examPartId AND usage_scope IN (:scopes)
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

    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestion(@Param("examPartId") String examPartId);

    @Query(value = "SELECT * FROM questions WHERE exam_part_id = :examPartId AND class_id = :classId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Question findOneRandomQuestionByClass(@Param("examPartId") String examPartId, @Param("classId") String classId);

    @Query("""
        SELECT q FROM Question q
        WHERE q.examPartId = :examPartId AND q.classId = :classId
          AND q.isBank = true AND q.usageScope IN :scopes
        ORDER BY function('RANDOM')
    """)
    List<Question> findRandomQuestionsByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("scopes") Collection<Question.UsageScope> scopes,
            Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.passageId = :passageId AND q.classId = :classId")
    List<Question> findByPassageIdAndClassId(@Param("passageId") String passageId, @Param("classId") String classId);

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
          AND q.classId = :classId
          AND q.chapterId = :chapterId
          AND q.isBank = true
          AND q.usageScope IN :scopes
        ORDER BY function('RANDOM')
    """)
    List<Question> findRandomQuestionsByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("scopes") Collection<Question.UsageScope> scopes,
            Pageable pageable
    );

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

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND created_by = :createdBy
          AND class_id IS NULL AND chapter_id IS NULL
          AND is_bank = true
          AND usage_scope IN (:scopes)
        ORDER BY RANDOM() LIMIT :limit
        """, nativeQuery = true)
    List<Question> findRandomByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND created_by = :createdBy
          AND class_id IS NULL AND chapter_id IS NULL
          AND is_bank = true
          AND usage_scope IN (:scopes)
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
            @Param("examPartId") String examPartId,
            @Param("createdBy") String createdBy,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND class_id = :classId AND is_bank = true
          AND usage_scope IN (:scopes)
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialQuestionsByExamPartIdAndClassId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
        SELECT * FROM questions
        WHERE exam_part_id = :examPartId AND class_id = :classId AND chapter_id = :chapterId AND is_bank = true
          AND usage_scope IN (:scopes)
        ORDER BY question_number ASC NULLS LAST, created_at ASC, question_id ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Question> findSequentialQuestionsByExamPartIdAndClassIdAndChapterId(
            @Param("examPartId") String examPartId,
            @Param("classId") String classId,
            @Param("chapterId") String chapterId,
            @Param("scopes") Collection<String> scopes,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    long countByCollectionId(String collectionId);

    long countByCollectionIdIn(Collection<String> collectionIds);

    /**
     * questionNumber đánh số theo kho ra đề nên MAX cũng phải tính trong đúng
     * phạm vi EXAM, nếu không câu PRACTICE sẽ đẩy số nhảy cóc.
     */
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

    @Query("""
        SELECT COALESCE(MAX(q.questionNumber), 0) FROM Question q
        WHERE q.examPartId = :examPartId
          AND q.createdBy IN :creatorIds
          AND q.classId IS NULL
          AND q.chapterId IS NULL
          AND q.isBank = true
          AND q.usageScope IN :scopes
    """)
    Integer findMaxQuestionNumberAdminBank(
            @Param("examPartId") String examPartId,
            @Param("creatorIds") Collection<String> creatorIds,
            @Param("scopes") Collection<Question.UsageScope> scopes);

    /** Xem ghi chú ở {@link #findRandomQuestionIdsByExamPartId}: chỉ chiếu question_id. */
    @Query(value = """
            SELECT q.question_id FROM questions q
            INNER JOIN question_tags qt ON qt.question_id = q.question_id
            WHERE qt.tag_id = :tagId AND q.exam_part_id = :examPartId
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
                SELECT 1 FROM questions q
                INNER JOIN question_tags qt ON qt.question_id = q.question_id
                WHERE qt.tag_id = :tagId AND q.exam_part_id = :examPartId
                  AND q.usage_scope IN (:scopes)
            )
            """, nativeQuery = true)
    boolean existsByTagAndExamPart(
            @Param("tagId") String tagId,
            @Param("examPartId") String examPartId,
            @Param("scopes") Collection<String> scopes);
}
