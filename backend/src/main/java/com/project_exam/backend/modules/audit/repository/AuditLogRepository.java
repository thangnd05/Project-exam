package com.project_exam.backend.modules.audit.repository;

import com.project_exam.backend.modules.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    Page<AuditLog> findByUserId(String userId, Pageable pageable);
    Page<AuditLog> findByActionIn(Collection<String> actions, Pageable pageable);
    Page<AuditLog> findByUserIdAndActionIn(String userId, Collection<String> actions, Pageable pageable);
}
