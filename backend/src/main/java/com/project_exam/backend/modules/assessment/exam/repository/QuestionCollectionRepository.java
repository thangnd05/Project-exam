package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionCollectionRepository extends JpaRepository<QuestionCollection, String> {
    Optional<QuestionCollection> findByNameIgnoreCase(String name);

    /** Các collection con trực tiếp của một collection cha. */
    List<QuestionCollection> findByParentId(String parentId);

    /** Có collection con nào không (chặn xoá cha / chặn biến cha thành con). */
    boolean existsByParentId(String parentId);

    long countByParentId(String parentId);
}
