package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTestRepository extends JpaRepository<UserTest, String>,
        JpaSpecificationExecutor<UserTest> {
    List<UserTest> findByUserId(String userId);
    List<UserTest> findByTestId(String testId);
    long countByTestId(String testId);
    long countByUserId(String userId);
    long countByUserIdAndStatus(String userId, UserTest.Status status);

    int countByUserIdAndTestIdAndStatus(String userId, String testId, UserTest.Status status);

    @Query("SELECT COUNT(ut) FROM UserTest ut WHERE ut.userId = :userId AND ut.testId = :testId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    int countCompletedExcludingMode(@Param("userId") String userId,
                                    @Param("testId") String testId,
                                    @Param("status") UserTest.Status status,
                                    @Param("practiceMode") UserTest.Mode practiceMode);

    @Query("SELECT COUNT(ut) FROM UserTest ut WHERE ut.userId = :userId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    int countByUserIdAndStatusExcludingMode(@Param("userId") String userId,
                                            @Param("status") UserTest.Status status,
                                            @Param("practiceMode") UserTest.Mode practiceMode);

    @Query("SELECT ut FROM UserTest ut WHERE ut.userId = :userId AND ut.testId = :testId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    Optional<UserTest> findActiveUserTest(@Param("userId") String userId,
                                          @Param("testId") String testId,
                                          @Param("status") UserTest.Status status,
                                          @Param("practiceMode") UserTest.Mode practiceMode);

    Optional<UserTest> findTopByUserIdAndTestIdAndStatusAndModeAndPracticePartIdsOrderByStartedAtDesc(
            String userId, String testId, UserTest.Status status, UserTest.Mode mode, String practicePartIds);

    @Query("SELECT ut FROM UserTest ut WHERE ut.guestSessionId = :guestSessionId AND ut.testId = :testId AND ut.status = :status")
    Optional<UserTest> findActiveGuestUserTest(@Param("guestSessionId") String guestSessionId,
                                               @Param("testId") String testId,
                                               @Param("status") UserTest.Status status);

    List<UserTest> findByGuestSessionId(String guestSessionId);
    List<UserTest> findByGuestSessionIdAndTestIdOrderByStartedAtDesc(String guestSessionId, String testId);

    @Query("SELECT ut FROM UserTest ut WHERE ut.status = :status AND ut.startedAt < :cutoff "
            + "AND (ut.mode = :practiceMode "
            + "OR (EXISTS (SELECT t FROM Test t WHERE t.testId = ut.testId "
            + "AND (t.durationMinutes IS NULL OR t.durationMinutes = 0) AND t.availableTo IS NULL) "
            + "AND NOT EXISTS (SELECT ua FROM UserAnswer ua WHERE ua.userTestId = ut.userTestId))) "
            + "ORDER BY ut.startedAt ASC")
    List<UserTest> findAbandonedUntimed(@Param("status") UserTest.Status status,
                                        @Param("practiceMode") UserTest.Mode practiceMode,
                                        @Param("cutoff") java.time.Instant cutoff,
                                        org.springframework.data.domain.Pageable pageable);

    // Xoá thật (bỏ qua @SQLDelete): chỉ dùng để dọn bài làm dở bị bỏ.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM assessment.user_tests WHERE user_test_id IN (:ids)", nativeQuery = true)
    void hardDeleteByIdIn(@Param("ids") Collection<String> ids);

    @Query("SELECT ut FROM UserTest ut WHERE ut.status = :status AND ut.mode <> :practiceMode "
            + "AND ut.startedAt < :cutoff "
            + "AND EXISTS (SELECT t FROM Test t WHERE t.testId = ut.testId "
            + "AND t.durationMinutes IS NOT NULL AND t.durationMinutes > 0) "
            + "ORDER BY ut.startedAt ASC")
    List<UserTest> findStaleTimedAttempts(@Param("status") UserTest.Status status,
                                          @Param("practiceMode") UserTest.Mode practiceMode,
                                          @Param("cutoff") java.time.Instant cutoff,
                                          org.springframework.data.domain.Pageable pageable);

    List<UserTest> findByUserIdAndTestId(String userId, String testId);
    List<UserTest> findByUserIdAndTestIdOrderByStartedAtDesc(String userId, String testId);
    List<UserTest> findByTestIdAndStatus(String testId, UserTest.Status status);

    interface LeaderboardRow {
        String getUserTestId();
        String getUserId();
        Long getRank();
        Long getTotal();
    }

    // Bảng xếp hạng tính ngay trong DB: mỗi người lấy lượt tốt nhất (điểm cao, rồi làm nhanh),
    // xếp hạng toàn bộ nhưng chỉ trả về top :limit cùng dòng của :userId, kèm tổng số người.
    @Query(value = """
            WITH best AS (
                SELECT DISTINCT ON (ut.user_id)
                       ut.user_test_id, ut.user_id, ut.total_score,
                       ut.finished_at - ut.started_at AS taken
                FROM assessment.user_tests ut
                WHERE ut.test_id = :testId
                  AND ut.status = :status
                  AND (ut.mode IS NULL OR ut.mode <> :practiceMode)
                  AND ut.deleted_at IS NULL
                ORDER BY ut.user_id, ut.total_score DESC NULLS LAST, taken ASC NULLS LAST, ut.user_test_id
            ), ranked AS (
                SELECT b.user_test_id, b.user_id,
                       ROW_NUMBER() OVER (ORDER BY b.total_score DESC NULLS LAST, b.taken ASC NULLS LAST,
                                                   b.user_test_id) AS rn,
                       COUNT(*) OVER () AS total
                FROM best b
            )
            SELECT r.user_test_id AS "userTestId", r.user_id AS "userId", r.rn AS "rank", r.total AS "total"
            FROM ranked r
            WHERE r.rn <= :limit OR r.user_id = :userId
            ORDER BY r.rn
            """, nativeQuery = true)
    List<LeaderboardRow> findLeaderboardRows(@Param("testId") String testId,
                                             @Param("status") String status,
                                             @Param("practiceMode") String practiceMode,
                                             @Param("userId") String userId,
                                             @Param("limit") int limit);

    @Query("""
            SELECT ut FROM UserTest ut
            WHERE ut.status = :status
              AND (ut.mode IS NULL OR ut.mode <> :practiceMode)
              AND ut.testId IN (
                SELECT t.testId FROM Test t
                WHERE t.examCategoryId = (
                  SELECT c.examCategoryId FROM ExamCategory c WHERE c.code = :categoryCode
                )
              )
            """)
    List<UserTest> findCompletedByCategoryCode(@Param("categoryCode") String categoryCode,
                                               @Param("status") UserTest.Status status,
                                               @Param("practiceMode") UserTest.Mode practiceMode);

    List<UserTest> findByUserIdAndStatusAndFinishedAtIsNotNullOrderByFinishedAtDesc(
            String userId, UserTest.Status status);

    List<UserTest> findByTestIdOrderByTotalScoreDesc(String testId);

    Optional<UserTest> findTopByUserIdAndTestIdOrderByStartedAtDesc(String userId, String testId);
    Optional<UserTest> findTopByUserIdOrderByStartedAtDesc(String userId);
    Optional<UserTest> findTopByUserIdAndStatusOrderByTotalScoreDesc(String userId, UserTest.Status status);

    long countByTestIdAndUserId(String testId, String userId);

    @Query("SELECT AVG(ut.totalScore) FROM UserTest ut WHERE ut.userId = :userId AND ut.status = :status")
    Double findAverageScoreByUserIdAndStatus(@Param("userId") String userId, @Param("status") UserTest.Status status);

    @Query("SELECT ut FROM UserTest ut WHERE ut.userId = :userId "
            + "AND ut.startedAt >= :start AND ut.startedAt < :end ORDER BY ut.startedAt ASC")
    List<UserTest> findByUserIdAndStartedAtRange(@Param("userId") String userId,
                                                 @Param("start") java.time.Instant start,
                                                 @Param("end") java.time.Instant end);

    @Query("SELECT MIN(ut.startedAt) FROM UserTest ut WHERE ut.userId = :userId")
    java.time.Instant findEarliestStartedAt(@Param("userId") String userId);

    @Query("SELECT MIN(ut.startedAt) FROM UserTest ut")
    java.time.Instant findEarliestStartedAt();

    long countByTestIdAndStatusAndTotalScoreLessThanEqual(String testId, UserTest.Status status, Integer score);

    long countByTestIdAndStatus(String testId, UserTest.Status status);

    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut WHERE ut.testId IN :testIds GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdIn(@Param("testIds") List<String> testIds);

    @Query("""
            SELECT ut.userTestId, c.code, ut.mode FROM UserTest ut
            LEFT JOIN Test t ON t.testId = ut.testId
            LEFT JOIN ExamCategory c ON c.examCategoryId = t.examCategoryId
            WHERE ut.userTestId IN :userTestIds
            """)
    List<Object[]> findDiagnosisSourcesByUserTestIdIn(@Param("userTestIds") Collection<String> userTestIds);

    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut "
            + "WHERE ut.testId IN :testIds AND ut.userId = :userId GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdInAndUserId(
            @Param("testIds") List<String> testIds, @Param("userId") String userId);

    long countByStatus(UserTest.Status status);

    @Query("SELECT ut.startedAt, ut.totalScore, ut.status FROM UserTest ut WHERE ut.startedAt >= :from")
    List<Object[]> findAttemptsSince(@Param("from") java.time.Instant from);

    @Query("SELECT ut.testId, COUNT(ut), "
            + "SUM(CASE WHEN ut.status = :completed THEN 1 ELSE 0 END) "
            + "FROM UserTest ut, Test t "
            + "WHERE t.testId = ut.testId AND t.classId IS NULL "
            + "AND (ut.mode IS NULL OR ut.mode = :fullMode) "
            + "GROUP BY ut.testId")
    List<Object[]> aggregateFullTestStats(@Param("completed") UserTest.Status completed,
                                          @Param("fullMode") UserTest.Mode fullMode);

    @Query("SELECT ut.testId, COUNT(ut), "
            + "SUM(CASE WHEN ut.status = :completed THEN 1 ELSE 0 END) "
            + "FROM UserTest ut, Test t "
            + "WHERE t.testId = ut.testId AND t.classId IS NULL "
            + "AND ut.mode = :practiceMode "
            + "GROUP BY ut.testId")
    List<Object[]> aggregatePracticeTestStats(@Param("completed") UserTest.Status completed,
                                              @Param("practiceMode") UserTest.Mode practiceMode);

}
