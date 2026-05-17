package com.project_exam.backend.modules.assessment.target.repository;

import com.project_exam.backend.modules.assessment.target.domain.UserTargetPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTargetPartRepository extends JpaRepository<UserTargetPart, String> {
    List<UserTargetPart> findByUserTargetId(String userTargetId);

    @Modifying
    void deleteByUserTargetId(String userTargetId);
}
