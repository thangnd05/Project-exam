package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, String> {

    List<Tag> findByExamTypeId(String examTypeId);

    List<Tag> findByParentId(String parentId);

    List<Tag> findByExamTypeIdAndParentIdIsNull(String examTypeId);

    boolean existsByNameAndExamTypeId(String name, String examTypeId);

}
