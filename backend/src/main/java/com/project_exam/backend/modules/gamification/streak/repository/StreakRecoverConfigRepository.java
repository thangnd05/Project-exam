package com.project_exam.backend.modules.gamification.streak.repository;

import com.project_exam.backend.modules.gamification.streak.domain.StreakRecoverConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreakRecoverConfigRepository extends JpaRepository<StreakRecoverConfig, String> {
}
