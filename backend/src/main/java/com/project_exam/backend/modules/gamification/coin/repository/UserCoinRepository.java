package com.project_exam.backend.modules.gamification.coin.repository;

import com.project_exam.backend.modules.gamification.coin.domain.UserCoin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCoinRepository extends JpaRepository<UserCoin, String> {
    Optional<UserCoin> findByUserId(String userId);

    boolean existsByUserId(String userId);
}
