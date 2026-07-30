package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.UserQuestionExposure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserQuestionExposureRepository extends JpaRepository<UserQuestionExposure, String> {

    Optional<UserQuestionExposure> findByUserIdAndQuestionId(String userId, String questionId);

    /** Các dòng exposure sẵn có của user cho 1 mẻ câu hỏi — ghi nhận theo lô thay vì từng câu. */
    List<UserQuestionExposure> findByUserIdAndQuestionIdIn(String userId, Collection<String> questionIds);

    @Query("SELECT e.questionId FROM UserQuestionExposure e WHERE e.userId = :userId AND e.questionId IN :questionIds")
    List<String> findSeenQuestionIds(@Param("userId") String userId, @Param("questionIds") Collection<String> questionIds);
}
