package com.project_exam.backend.modules.gamification.cosmetic.repository;

import com.project_exam.backend.modules.gamification.cosmetic.domain.UserCosmetic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCosmeticRepository extends JpaRepository<UserCosmetic, String> {
    List<UserCosmetic> findByUserId(String userId);

    Optional<UserCosmetic> findByUserIdAndCosmeticId(String userId, String cosmeticId);

    boolean existsByUserIdAndCosmeticId(String userId, String cosmeticId);

    List<UserCosmetic> findByUserIdAndEquippedTrue(String userId);

    List<UserCosmetic> findByUserIdInAndEquippedTrue(java.util.Collection<String> userIds);
}
