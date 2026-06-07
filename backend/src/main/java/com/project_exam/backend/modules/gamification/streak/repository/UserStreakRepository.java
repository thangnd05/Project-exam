package com.project_exam.backend.modules.gamification.streak.repository;

import com.project_exam.backend.modules.gamification.streak.domain.UserStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserStreakRepository extends JpaRepository<UserStreak, String> {
    Optional<UserStreak> findByUserId(String userId);

    // Dành cho leaderboard streak trong tương lai (chưa dùng).
    List<UserStreak> findTop10ByOrderByCurrentStreakDesc();
}
