package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, String> {

    List<QuestionTag> findByQuestionId(String questionId);

    List<QuestionTag> findByTagId(String tagId);

    void deleteByQuestionId(String questionId);

    void deleteByTagId(String tagId);

}
