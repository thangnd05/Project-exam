package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, String> {
    List<UserAnswer> findByUserTestId(String userTestId);
    List<UserAnswer> findByQuestionId(String questionId);
    Optional<UserAnswer> findByUserTestIdAndQuestionId(String userTestId, String questionId);

    @Modifying
    @Query("DELETE FROM UserAnswer ua WHERE ua.questionId = :questionId")
    void deleteByQuestionId(@Param("questionId") String questionId);

    @Modifying
    @Query("DELETE FROM UserAnswer ua WHERE ua.userTestId IN :userTestIds")
    void deleteByUserTestIdIn(@Param("userTestIds") List<String> userTestIds);
}
