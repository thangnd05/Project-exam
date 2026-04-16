package com.example.english_exam.repositories;

import com.example.english_exam.models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
    List<AuditLog> findTop200ByUserIdOrderByCreatedAtDesc(Long userId);
}
