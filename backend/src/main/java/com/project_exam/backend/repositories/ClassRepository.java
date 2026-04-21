package com.project_exam.backend.repositories;

import com.project_exam.backend.models.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, String> {

    boolean existsByClassId(String classId);

    // Nếu muốn lấy danh sách lớp của 1 giáo viên
    List<ClassEntity> findByTeacherId(String teacherId);

    Optional<ClassEntity> findByclassId(String classId);

    boolean existsByClassIdAndTeacherId(String classId, String teacherId);
}
