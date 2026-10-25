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

    /**
     * Khoá theo người làm (user hoặc phiên khách) + đề tới hết transaction: bấm "Bắt đầu" hai lần
     * hay mở hai tab cùng lúc thì request sau chờ, rồi thấy và dùng lại lượt request trước vừa tạo.
     */
    @Query(value = "SELECT 1 FROM pg_advisory_xact_lock(hashtext('user-test-start:' || :ownerId || ':' || :testId))",
            nativeQuery = true)
    Integer lockStartOf(@Param("ownerId") String ownerId, @Param("testId") String testId);

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

    // Lượt có giờ đã quá hạn thật (khớp AttemptTimeUtil.scheduledEnd): bắt đầu + thời lượng, hoặc giờ đóng đề,
    // sớm hơn :closedBefore (= now - ân hạn). Cộng interval nên phải viết native.
    @Query(value = "SELECT ut.* FROM assessment.user_tests ut "
            + "JOIN assessment.tests t ON t.test_id = ut.test_id AND t.deleted_at IS NULL "
            + "WHERE ut.deleted_at IS NULL AND ut.status = :status "
            + "AND (ut.mode IS NULL OR ut.mode <> :practiceMode) "
            + "AND ((t.duration_minutes > 0 "
            + "AND ut.started_at + make_interval(mins => t.duration_minutes) < :closedBefore) "
            + "OR t.available_to < :closedBefore) "
            + "ORDER BY ut.started_at ASC LIMIT :limit",
            nativeQuery = true)
    List<UserTest> findOverdueTimedAttempts(@Param("status") String status,
                                            @Param("practiceMode") String practiceMode,
                                            @Param("closedBefore") java.time.Instant closedBefore,
                                            @Param("limit") int limit);

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

    interface HallOfFameRow {
        String getUserTestId();
        Long getTotal();
    }

    // Bảng vinh danh tính trong DB: mỗi người (user hoặc phiên khách) lấy lượt tốt nhất
    // (điểm cao, làm nhanh, nộp sớm), chỉ trả về top :limit kèm tổng số người tham gia.
    @Query(value = """
            WITH attempts AS (
                SELECT ut.user_test_id, ut.total_score, ut.started_at, ut.finished_at,
                       ut.finished_at - ut.started_at AS taken,
                       COALESCE('user:' || NULLIF(ut.user_id, ''),
                                'guest:' || NULLIF(ut.guest_session_id, '')) AS person_key
                FROM assessment.user_tests ut
                JOIN assessment.tests t ON t.test_id = ut.test_id AND t.deleted_at IS NULL
                JOIN assessment.exam_categories c ON c.exam_category_id = t.exam_category_id
                                                 AND c.deleted_at IS NULL
                WHERE c.code = :categoryCode
                  AND t.exam_type_id = :examTypeId
                  AND ut.status = :status
                  AND (ut.mode IS NULL OR ut.mode <> :practiceMode)
                  AND ut.deleted_at IS NULL
            ), best AS (
                SELECT DISTINCT ON (a.person_key) a.*
                FROM attempts a
                WHERE a.person_key IS NOT NULL
                ORDER BY a.person_key, a.total_score DESC NULLS LAST, a.taken ASC NULLS LAST,
                         a.finished_at ASC NULLS LAST, a.started_at ASC NULLS LAST
            )
            SELECT b.user_test_id AS "userTestId", COUNT(*) OVER () AS "total"
            FROM best b
            ORDER BY b.total_score DESC NULLS LAST, b.taken ASC NULLS LAST,
                     b.finished_at ASC NULLS LAST, b.started_at ASC NULLS LAST, b.user_test_id
            LIMIT :limit
            """, nativeQuery = true)
    List<HallOfFameRow> findHallOfFameRows(@Param("categoryCode") String categoryCode,
                                           @Param("examTypeId") String examTypeId,
                                           @Param("status") String status,
                                           @Param("practiceMode") String practiceMode,
                                           @Param("limit") int limit);

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

    @Query("SELECT ut.startedAt FROM UserTest ut WHERE ut.startedAt >= :from")
    List<java.time.Instant> findStartedAtSince(@Param("from") java.time.Instant from);

    // Mỗi đề công khai (gộp thi thật + ôn luyện): testId, tên đề, số lượt làm, số người làm
    // (tài khoản hoặc phiên khách khác nhau). Nhiều lượt nhất lên đầu.
    @Query(value = "SELECT ut.testId, t.title, COUNT(ut), COUNT(DISTINCT COALESCE(ut.userId, ut.guestSessionId)) "
            + "FROM UserTest ut, Test t "
            + "WHERE t.testId = ut.testId AND t.classId IS NULL "
            + "GROUP BY ut.testId, t.title "
            + "ORDER BY COUNT(ut) DESC, t.title ASC",
            countQuery = "SELECT COUNT(DISTINCT ut.testId) FROM UserTest ut, Test t "
                    + "WHERE t.testId = ut.testId AND t.classId IS NULL")
    org.springframework.data.domain.Page<Object[]> aggregateTestUsage(
            org.springframework.data.domain.Pageable pageable);

}
