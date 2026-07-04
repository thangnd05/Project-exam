package com.project_exam.backend.modules.assessment.attempt.repository;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTestRepository extends JpaRepository<UserTest, String> {
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

    List<UserTest> findByUserIdAndTestId(String userId, String testId);
    List<UserTest> findByUserIdAndTestIdOrderByStartedAtDesc(String userId, String testId);
    List<UserTest> findByTestIdAndStatus(String testId, UserTest.Status status);

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
                                                 @Param("start") java.time.LocalDateTime start,
                                                 @Param("end") java.time.LocalDateTime end);

    /** Mốc bắt đầu sớm nhất của user — để dựng danh sách tháng có thể chọn. */
    @Query("SELECT MIN(ut.startedAt) FROM UserTest ut WHERE ut.userId = :userId")
    java.time.LocalDateTime findEarliestStartedAt(@Param("userId") String userId);

    long countByTestIdAndStatusAndTotalScoreLessThanEqual(String testId, UserTest.Status status, Integer score);

    long countByTestIdAndStatus(String testId, UserTest.Status status);

    /** Batch count attempt cho nhiều testId 1 lần — tránh N+1 trong list test. */
    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut WHERE ut.testId IN :testIds GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdIn(@Param("testIds") List<String> testIds);

    /** Batch count attempt của 1 user trên nhiều testId — tránh N+1 trong list test cho user. */
    @Query("SELECT ut.testId, COUNT(ut) FROM UserTest ut "
            + "WHERE ut.testId IN :testIds AND ut.userId = :userId GROUP BY ut.testId")
    List<Object[]> countGroupedByTestIdInAndUserId(
            @Param("testIds") List<String> testIds, @Param("userId") String userId);

}
