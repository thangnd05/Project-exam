package com.project_exam.backend.modules.classroom.chapter.repository;

import com.project_exam.backend.modules.classroom.chapter.domain.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, String> {

    List<Chapter> findByClassId(String classId);
}
