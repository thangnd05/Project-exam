package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ResourceTagRepository extends JpaRepository<ResourceTag, String> {

    List<ResourceTag> findByResourceId(String resourceId);

    List<ResourceTag> findByTagId(String tagId);

    void deleteByResourceId(String resourceId);

    void deleteByTagId(String tagId);

    @Query("SELECT rt.resourceId FROM ResourceTag rt WHERE rt.tagId IN :tagIds GROUP BY rt.resourceId HAVING COUNT(DISTINCT rt.tagId) = :tagCount")
    List<String> findResourceIdsMatchingAllTags(List<String> tagIds, long tagCount);

    List<ResourceTag> findByTagIdIn(java.util.Collection<String> tagIds);

}
