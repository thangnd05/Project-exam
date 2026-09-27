package com.project_exam.backend.modules.gamification.streak.repository;

import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserStreakRepository extends JpaRepository<UserStreak, String> {
    Optional<UserStreak> findByUserId(String userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM UserStreak s WHERE s.userId = :userId")
    Optional<UserStreak> findByUserIdForUpdate(@Param("userId") String userId);

    @Query("""
            SELECT s FROM UserStreak s
            WHERE s.longestStreak > 0
            ORDER BY s.longestStreak DESC, s.updatedAt ASC
            """)
    List<UserStreak> findRankedByLongestStreak(Pageable pageable);

    long countByLongestStreakGreaterThan(int longestStreak);
}
