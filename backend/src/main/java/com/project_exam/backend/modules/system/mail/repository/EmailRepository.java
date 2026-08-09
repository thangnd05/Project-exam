package com.project_exam.backend.modules.system.mail.repository;

import com.project_exam.backend.modules.system.mail.domain.Email;
import com.project_exam.backend.modules.system.mail.domain.EmailType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailRepository extends JpaRepository<Email, String> {

    Optional<Email> findByCode(String code);

    List<Email> findByTypeOrderByCodeAsc(EmailType type);

    Page<Email> findByTypeOrderByCreatedAtDesc(EmailType type, Pageable pageable);
}
