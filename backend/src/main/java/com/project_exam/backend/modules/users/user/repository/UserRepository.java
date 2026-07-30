package com.project_exam.backend.modules.users.user.repository;

import com.project_exam.backend.modules.users.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUserName(String userName);
    List<User> findByRoleId(String id);

    @Query("SELECT u.createdAt FROM User u WHERE u.createdAt >= :from")
    List<Instant> findCreatedAtSince(Instant from);

    @Query("SELECT MIN(u.createdAt) FROM User u")
    Instant findEarliestCreatedAt();
}
