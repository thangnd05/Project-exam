package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, String> {

    /** Loại kỳ thi chuẩn (KHÔNG linh hoạt, vd ẩn "Thông Thường"); row cũ flexible NULL coi như chuẩn. */
    @Query("SELECT e FROM ExamType e WHERE e.flexible IS NULL OR e.flexible = false")
    List<ExamType> findStandard();

    /** Loại kỳ thi linh hoạt (flexible = true, vd "Thông Thường"). */
    @Query("SELECT e FROM ExamType e WHERE e.flexible = true")
    List<ExamType> findFlexible();

    /** examType con trực tiếp của 1 examType cha. */
    List<ExamType> findByParentId(String parentId);

    boolean existsByParentId(String parentId);

    long countByParentId(String parentId);
}
