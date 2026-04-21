package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Test;
import com.project_exam.backend.models.TestPart;
import com.project_exam.backend.models.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, String> {

    List<Test>findByCreatedBy(String id);

    List<Test>findByClassId(String classId);

    List<Test> findByClassIdAndChapterId(String classId, String chapterId);

    List<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy);

}
