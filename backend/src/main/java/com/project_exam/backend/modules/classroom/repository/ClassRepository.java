package com.project_exam.backend.modules.classroom.repository;

import com.project_exam.backend.modules.classroom.domain.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, String> {

    boolean existsByClassId(String classId);
    boolean existsByClassQr(String classQr);

    // Nếu muốn lấy danh sách lớp của 1 giáo viên
    List<ClassEntity> findByTeacherId(String teacherId);

    Optional<ClassEntity> findByclassId(String classId);
    Optional<ClassEntity> findByClassQr(String classQr);

    boolean existsByClassIdAndTeacherId(String classId, String teacherId);
}
