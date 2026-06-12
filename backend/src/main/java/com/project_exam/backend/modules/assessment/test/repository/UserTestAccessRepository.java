package com.project_exam.backend.modules.assessment.test.repository;

import com.project_exam.backend.modules.assessment.test.domain.UserTestAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserTestAccessRepository extends JpaRepository<UserTestAccess, String> {
    boolean existsByUserIdAndTestId(String userId, String testId);

    List<UserTestAccess> findByUserId(String userId);
}
