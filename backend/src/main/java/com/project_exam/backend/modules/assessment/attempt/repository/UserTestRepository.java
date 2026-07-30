package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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

    /** Đếm lượt đã hoàn thành nhưng BỎ chế độ luyện tập (practice không tính vào maxAttempts). */
    @Query("SELECT COUNT(ut) FROM UserTest ut WHERE ut.userId = :userId AND ut.testId = :testId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    int countCompletedExcludingMode(@Param("userId") String userId,
                                    @Param("testId") String testId,
                                    @Param("status") UserTest.Status status,
                                    @Param("practiceMode") UserTest.Mode practiceMode);

    /** Đếm TỔNG lượt đã hoàn thành của user (mọi test), BỎ chế độ practice — dùng cho quest. */
    @Query("SELECT COUNT(ut) FROM UserTest ut WHERE ut.userId = :userId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    int countByUserIdAndStatusExcludingMode(@Param("userId") String userId,
                                            @Param("status") UserTest.Status status,
                                            @Param("practiceMode") UserTest.Mode practiceMode);

    // Resume của FULL_TEST: chỉ lấy attempt full-test (mode NULL cũ = full), bỏ qua practice.
    @Query("SELECT ut FROM UserTest ut WHERE ut.userId = :userId AND ut.testId = :testId "
            + "AND ut.status = :status AND (ut.mode IS NULL OR ut.mode <> :practiceMode)")
    Optional<UserTest> findActiveUserTest(@Param("userId") String userId,
                                          @Param("testId") String testId,
                                          @Param("status") UserTest.Status status,
                                          @Param("practiceMode") UserTest.Mode practiceMode);

    // Resume của PRACTICE: khớp đúng bộ Part đã chọn (CSV đã sort) để không lẫn phiên.
    Optional<UserTest> findTopByUserIdAndTestIdAndStatusAndModeAndPracticePartIdsOrderByStartedAtDesc(
            String userId, String testId, UserTest.Status status, UserTest.Mode mode, String practicePartIds);

    @Query("SELECT ut FROM UserTest ut WHERE ut.guestSessionId = :guestSessionId AND ut.testId = :testId AND ut.status = :status")
    Optional<UserTest> findActiveGuestUserTest(@Param("guestSessionId") String guestSessionId,
                                               @Param("testId") String testId,
                                               @Param("status") UserTest.Status status);

    List<UserTest> findByGuestSessionId(String guestSessionId);
    List<UserTest> findByGuestSessionIdAndTestIdOrderByStartedAtDesc(String guestSessionId, String testId);

    // Các attempt "bỏ dở" của bài KHÔNG giới hạn giờ (không tự nộp được) và đã quá ngưỡng:
    //  - mode = PRACTICE (luyện tập luôn không giờ) -> luôn dọn (miễn phí, không xếp hạng), HOẶC
    //  - full-test không giờ (durationMinutes null/0 và availableTo null) NHƯNG chỉ khi
    //    CHƯA có đáp án nào, để không xoá mất tiến độ của người làm cách quãng nhiều ngày.
    // Bài có giờ KHÔNG nằm ở đây vì đã có cơ chế tự nộp phía client.
    // Lấy tối đa 1 lô (giới hạn qua Pageable), xoá bài cũ nhất trước để không ôm transaction lớn.
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

    List<UserTest> findByUserIdAndTestId(String userId, String testId);
    List<UserTest> findByUserIdAndTestIdOrderByStartedAtDesc(String userId, String testId);
    List<UserTest> findByTestIdAndStatus(String testId, UserTest.Status status);

    // Bài đã hoàn thành của user, sắp xếp mới nhất trước (sort ở DB, không sort ở FE).
    List<UserTest> findByUserIdAndStatusAndFinishedAtIsNotNullOrderByFinishedAtDesc(
            String userId, UserTest.Status status);

    List<UserTest> findByTestIdOrderByTotalScoreDesc(String testId);

    Optional<UserTest> findTopByUserIdAndTestIdOrderByStartedAtDesc(String userId, String testId);
    Optional<UserTest> findTopByUserIdOrderByStartedAtDesc(String userId);
    Optional<UserTest> findTopByUserIdAndStatusOrderByTotalScoreDesc(String userId, UserTest.Status status);

    long countByTestIdAndUserId(String testId, String userId);

    @Query("SELECT AVG(ut.totalScore) FROM UserTest ut WHERE ut.userId = :userId AND ut.status = :status")
    Double findAverageScoreByUserIdAndStatus(@Param("userId") String userId, @Param("status") UserTest.Status status);

    /** Các lượt làm bài bắt đầu trong khoảng [start, end) — phục vụ biểu đồ hoạt động theo tháng. */
    @Query("SELECT ut FROM UserTest ut WHERE ut.userId = :userId "
            + "AND ut.startedAt >= :start AND ut.startedAt < :end ORDER BY ut.startedAt ASC")
    List<UserTest> findByUserIdAndStartedAtRange(@Param("userId") String userId,
                                                 @Param("start") java.time.Instant start,
                                                 @Param("end") java.time.Instant end);

    /** Mốc bắt đầu sớm nhất của user — để dựng danh sách tháng có thể chọn. */
    @Query("SELECT MIN(ut.startedAt) FROM UserTest ut WHERE ut.userId = :userId")
    java.time.Instant findEarliestStartedAt(@Param("userId") String userId);

    /** Mốc bắt đầu sớm nhất toàn hệ thống — dựng danh sách năm chọn cho biểu đồ hiệu suất. */
    @Query("SELECT MIN(ut.startedAt) FROM UserTest ut")
    java.time.Instant findEarliestStartedAt();

    long countByTestIdAndStatusAndTotalScoreLessThanEqual(String testId, UserTest.Status status, Integer score);

    long countByTestIdAndStatus(String testId, UserTest.Status status);

    /** Batch count attempt cho nhiều testId 1 lần — tránh N+1 trong list test. */
    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut WHERE ut.testId IN :testIds GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdIn(@Param("testIds") List<String> testIds);

    /**
     * Nguồn chẩn đoán của các lộ trình: [userTestId, ExamCategory.code (null nếu không gắn),
     * UserTest.mode] — 1 query cho cả danh sách plan, tránh N+1 khi build PlanResponse.
     * LEFT JOIN để bài không gắn category vẫn trả về mode.
     */
    @Query("""
            SELECT ut.userTestId, c.code, ut.mode FROM UserTest ut
            LEFT JOIN Test t ON t.testId = ut.testId
            LEFT JOIN ExamCategory c ON c.examCategoryId = t.examCategoryId
            WHERE ut.userTestId IN :userTestIds
            """)
    List<Object[]> findDiagnosisSourcesByUserTestIdIn(@Param("userTestIds") Collection<String> userTestIds);

    /** Batch count attempt của 1 user trên nhiều testId — tránh N+1 trong list test cho user. */
    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut "
            + "WHERE ut.testId IN :testIds AND ut.userId = :userId GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdInAndUserId(
            @Param("testIds") List<String> testIds, @Param("userId") String userId);

    // ── Thống kê Dashboard admin ──────────────────────────────
    long countByStatus(UserTest.Status status);

    /** (startedAt, totalScore, status) từ mốc :from — dựng biểu đồ hiệu suất theo tháng. */
    @Query("SELECT ut.startedAt, ut.totalScore, ut.status FROM UserTest ut WHERE ut.startedAt >= :from")
    List<Object[]> findAttemptsSince(@Param("from") java.time.Instant from);

    /**
     * Bài thi CÔNG KHAI (không thuộc lớp) làm nhiều nhất ở chế độ FULL_TEST:
     * [testId, tổng lượt, số hoàn thành]. Row cũ mode = NULL coi như full. Sắp xếp & lấy top ở service.
     */
    @Query("SELECT ut.testId, COUNT(ut), "
            + "SUM(CASE WHEN ut.status = :completed THEN 1 ELSE 0 END) "
            + "FROM UserTest ut, Test t "
            + "WHERE t.testId = ut.testId AND t.classId IS NULL "
            + "AND (ut.mode IS NULL OR ut.mode = :fullMode) "
            + "GROUP BY ut.testId")
    List<Object[]> aggregateFullTestStats(@Param("completed") UserTest.Status completed,
                                          @Param("fullMode") UserTest.Mode fullMode);

    /**
     * Bài thi CÔNG KHAI (không thuộc lớp) được LUYỆN TẬP (PRACTICE) nhiều nhất:
     * [testId, tổng lượt, số hoàn thành]. Sắp xếp & lấy top ở service.
     */
    @Query("SELECT ut.testId, COUNT(ut), "
            + "SUM(CASE WHEN ut.status = :completed THEN 1 ELSE 0 END) "
            + "FROM UserTest ut, Test t "
            + "WHERE t.testId = ut.testId AND t.classId IS NULL "
            + "AND ut.mode = :practiceMode "
            + "GROUP BY ut.testId")
    List<Object[]> aggregatePracticeTestStats(@Param("completed") UserTest.Status completed,
                                              @Param("practiceMode") UserTest.Mode practiceMode);

}
