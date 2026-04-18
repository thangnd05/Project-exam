package com.example.english_exam.repositories;

import com.example.english_exam.models.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    Page<AuditLog> findByActionIn(Collection<String> actions, Pageable pageable);
    Page<AuditLog> findByUserIdAndActionIn(Long userId, Collection<String> actions, Pageable pageable);
}
