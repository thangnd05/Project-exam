package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, String> {

    List<Test>findByCreatedBy(String id);

    /** Batch fetch test theo nhiều creator — thay loop findByCreatedBy. */
    List<Test> findByCreatedByIn(Collection<String> userIds);

    List<Test>findByClassId(String classId);

    List<Test> findByClassIdAndChapterId(String classId, String chapterId);

    List<Test> findByCreatedByAndClassIdIsNullAndChapterIdIsNull(String createdBy);

}
