package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResourceTagRepository extends JpaRepository<ResourceTag, String> {

    List<ResourceTag> findByResourceId(String resourceId);

    List<ResourceTag> findByTagId(String tagId);

    void deleteByResourceId(String resourceId);

    void deleteByTagId(String tagId);

    @Query("SELECT rt.resourceId FROM ResourceTag rt WHERE rt.tagId IN :tagIds GROUP BY rt.resourceId HAVING COUNT(DISTINCT rt.tagId) = :tagCount")
    List<String> findResourceIdsMatchingAllTags(List<String> tagIds, long tagCount);

    List<ResourceTag> findByTagIdIn(java.util.Collection<String> tagIds);

    List<ResourceTag> findByResourceIdIn(java.util.Collection<String> resourceIds);

    /** Bộ [resourceId, examPartId, tag sortOrder] của các tài liệu có tag thuộc các phần thi đã cho. */
    @Query("""
            SELECT rt.resourceId, t.examPartId, t.sortOrder FROM ResourceTag rt
            JOIN Tag t ON t.tagId = rt.tagId
            WHERE t.examPartId IN :examPartIds
            """)
    List<Object[]> findResourcePartPairs(@Param("examPartIds") java.util.Collection<String> examPartIds);

    @Query("SELECT rt.tagId, COUNT(rt) FROM ResourceTag rt JOIN Tag t ON t.tagId = rt.tagId WHERE t.examTypeId = :examTypeId GROUP BY rt.tagId")
    List<Object[]> countByTagForExamType(@Param("examTypeId") String examTypeId);

}
