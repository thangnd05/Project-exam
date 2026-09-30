package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPlanRepository extends JpaRepository<LearningPlan, String> {

    List<LearningPlan> findByUserIdAndExamTypeIdOrderByCreatedAtDesc(String userId, String examTypeId);

    List<LearningPlan> findByUserIdOrderByCreatedAtDesc(String userId);

    List<LearningPlan> findBySourceUserTestIdIn(java.util.Collection<String> sourceUserTestIds);

    Optional<LearningPlan> findTopByUserIdAndExamTypeIdAndStatusOrderByCreatedAtDesc(
            String userId, String examTypeId, LearningPlan.Status status);

    List<LearningPlan> findByUserIdAndExamTypeIdAndStatus(
            String userId, String examTypeId, LearningPlan.Status status);

    /** Khoá theo (người dùng, kỳ thi) tới hết transaction để hai lần sinh/đổi lộ trình không chạy chồng nhau. */
    @Query(value = "SELECT 1 FROM pg_advisory_xact_lock(hashtext(:userId || ':' || :examTypeId))",
            nativeQuery = true)
    Integer lockPlansOf(@Param("userId") String userId, @Param("examTypeId") String examTypeId);

    /** Tính cả lộ trình đã xoá mềm để số thứ tự lộ trình không bị lặp lại. */
    @Query(value = """
            SELECT COALESCE(MAX(plan_sequence), 0) FROM assessment.learning_plans
            WHERE user_id = :userId AND exam_type_id = :examTypeId
            """, nativeQuery = true)
    int findMaxPlanSequenceIncludingDeleted(
            @Param("userId") String userId, @Param("examTypeId") String examTypeId);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, LearningPlan.Status status);
}
