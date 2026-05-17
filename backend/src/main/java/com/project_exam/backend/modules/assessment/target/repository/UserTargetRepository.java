package com.project_exam.backend.modules.assessment.target.repository;

import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTargetRepository extends JpaRepository<UserTarget, String> {

    Optional<UserTarget> findByUserIdAndExamTypeId(String userId, String examTypeId);
}
