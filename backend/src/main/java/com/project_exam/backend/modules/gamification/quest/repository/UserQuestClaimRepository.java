package com.project_exam.backend.modules.gamification.quest.repository;

import com.project_exam.backend.modules.gamification.quest.domain.UserQuestClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuestClaimRepository extends JpaRepository<UserQuestClaim, String> {
    List<UserQuestClaim> findByUserId(String userId);

    boolean existsByUserIdAndQuestId(String userId, String questId);

    long countByQuestId(String questId);
}
