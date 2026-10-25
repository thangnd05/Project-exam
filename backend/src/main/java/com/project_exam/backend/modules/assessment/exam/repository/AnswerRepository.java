package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, String> {

    List<Answer> findByQuestionId(String questionId);

    List<Answer> findByQuestionIdInAndIsCorrectTrue(List<String> questionIds);

    List<Answer> findByQuestionIdIn(List<String> questionIds);

    void deleteByQuestionId(String questionId);
}
