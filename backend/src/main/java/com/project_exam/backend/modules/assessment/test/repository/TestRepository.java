package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, String> {

    List<Test>findByCreatedBy(String id);

    List<Test> findByCreatedByIn(Collection<String> userIds);

    List<Test> findByExamTypeIdAndCreatedByIn(String examTypeId, Collection<String> createdByIds);

    List<Test>findByClassId(String classId);

    List<Test> findByExamCategoryId(String examCategoryId);

    List<Test> findByExamTypeId(String examTypeId);

    List<Test> findByClassIdAndChapterId(String classId, String chapterId);

    List<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy);

    Page<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy, Pageable pageable);

    List<Test> findByClassIdIsNullAndCreatedByIn(Collection<String> createdByIds);

    Page<Test> findByClassIdIsNullAndCreatedByInAndCollectionIdIn(
            Collection<String> createdByIds, Collection<String> collectionIds, Pageable pageable);

    long countByClassIdIsNullAndCreatedByInAndCollectionIdIn(
            Collection<String> createdByIds, Collection<String> collectionIds);

    List<Test> findByExamTypeIdAndClassIdIsNullAndCreatedByInAndExamCategoryIdIn(
            String examTypeId, Collection<String> createdByIds, Collection<String> examCategoryIds);

    @Query(value = """
            SELECT t FROM Test t
            LEFT JOIN QuestionCollection c ON c.collectionId = t.collectionId
            LEFT JOIN QuestionCollection pc ON pc.collectionId = c.parentId
            WHERE t.examTypeId = :examTypeId
              AND t.classId IS NULL
              AND t.createdBy IN :createdByIds
              AND (t.examCategoryId IS NULL OR t.examCategoryId NOT IN :excludedCategoryIds)
            ORDER BY
              CASE WHEN c.collectionId IS NULL THEN 1 ELSE 0 END,
              COALESCE(pc.displayOrder, c.displayOrder, 2147483647),
              CASE WHEN pc.collectionId IS NULL THEN 0 ELSE COALESCE(c.displayOrder, 2147483647) END,
              c.name,
              t.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(t) FROM Test t
            WHERE t.examTypeId = :examTypeId
              AND t.classId IS NULL
              AND t.createdBy IN :createdByIds
              AND (t.examCategoryId IS NULL OR t.examCategoryId NOT IN :excludedCategoryIds)
            """)
    Page<Test> findByExamTypeOrderByCollection(@Param("examTypeId") String examTypeId,
                                               @Param("createdByIds") Collection<String> createdByIds,
                                               @Param("excludedCategoryIds") Collection<String> excludedCategoryIds,
                                               Pageable pageable);


    long countByExamCategoryId(String examCategoryId);

    long countByExamTypeId(String examTypeId);
}
