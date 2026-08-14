package com.project_exam.backend.modules.assessment.target.repository;

import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTargetRepository extends JpaRepository<UserTarget, String> {

    Optional<UserTarget> findByUserIdAndExamTypeId(String userId, String examTypeId);

    /** Mọi mục tiêu của user  dùng khi dựng danh sách plan nhiều kỳ thi (tránh query từng plan). */
    List<UserTarget> findByUserId(String userId);
}
