package com.project_exam.backend.repositories;

import com.project_exam.backend.models.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, String> {
    List<UserAnswer> findByUserTestId(String userTestId);
    List<UserAnswer> findByQuestionId(String questionId);
}
