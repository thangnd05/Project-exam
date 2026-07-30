package com.project_exam.backend.modules.classroom.clazz.repository;

import com.project_exam.backend.modules.classroom.clazz.domain.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, String> {

    boolean existsByClassId(String classId);
    boolean existsByClassQr(String classQr);

    List<ClassEntity> findByTeacherId(String teacherId);

    Optional<ClassEntity> findByclassId(String classId);
    Optional<ClassEntity> findByClassQr(String classQr);

    boolean existsByClassIdAndTeacherId(String classId, String teacherId);
}
