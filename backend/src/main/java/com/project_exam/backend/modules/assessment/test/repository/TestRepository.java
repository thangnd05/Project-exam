package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
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

    /** Batch fetch test theo nhiều creator — thay loop findByCreatedBy. */
    List<Test> findByCreatedByIn(Collection<String> userIds);

    List<Test>findByClassId(String classId);

    /** Lấy tất cả test thuộc 1 exam category (vd: Quick Challenge) — dùng cho hero landing page. */
    List<Test> findByExamCategoryId(String examCategoryId);

    /** Tất cả test của 1 kỳ thi — dùng lọc lịch sử mock theo examType. */
    List<Test> findByExamTypeId(String examTypeId);

    List<Test> findByClassIdAndChapterId(String classId, String chapterId);

    List<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy);

    Page<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy, Pageable pageable);

    Page<Test> findByExamTypeIdAndClassIdIsNullAndCreatedByIn(
            String examTypeId, Collection<String> createdByIds, Pageable pageable);

    // Đề admin (công khai) thuộc một tập bộ đề (collection cha + các con) — cho trang drill-in.
    Page<Test> findByClassIdIsNullAndCreatedByInAndCollectionIdIn(
            Collection<String> createdByIds, Collection<String> collectionIds, Pageable pageable);

    // Đếm đề admin theo từng tập collection — cho số lượng hiển thị trên thẻ folder.
    long countByClassIdIsNullAndCreatedByInAndCollectionIdIn(
            Collection<String> createdByIds, Collection<String> collectionIds);

}
