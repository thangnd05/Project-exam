package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, String> {

    List<Tag> findByExamTypeId(String examTypeId);

    // Sắp theo sortOrder (nhỏ trước); Postgres xếp NULL xuống cuối mặc định.
    List<Tag> findByExamTypeIdOrderBySortOrderAsc(String examTypeId);

    List<Tag> findByParentId(String parentId);

    boolean existsByNameAndExamTypeId(String name, String examTypeId);

}
