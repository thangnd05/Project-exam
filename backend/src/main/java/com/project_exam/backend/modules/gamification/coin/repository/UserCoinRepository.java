package com.project_exam.backend.modules.gamification.coin.repository;

import com.project_exam.backend.modules.gamification.coin.domain.UserCoin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCoinRepository extends JpaRepository<UserCoin, String> {
    Optional<UserCoin> findByUserId(String userId);

    boolean existsByUserId(String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE UserCoin u SET u.balance = u.balance - :amount, u.updatedAt = CURRENT_TIMESTAMP "
            + "WHERE u.userId = :userId AND u.balance >= :amount")
    int deduct(@Param("userId") String userId, @Param("amount") int amount);

    // Cộng xu atomic ở DB (tránh lost-update khi cộng đồng thời). 0 = ví chưa tồn tại.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE UserCoin u SET u.balance = u.balance + :amount, u.updatedAt = CURRENT_TIMESTAMP "
            + "WHERE u.userId = :userId")
    int increment(@Param("userId") String userId, @Param("amount") int amount);
}
