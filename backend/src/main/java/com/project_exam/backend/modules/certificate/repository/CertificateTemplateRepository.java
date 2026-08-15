package com.project_exam.backend.modules.certificate.repository;

import com.project_exam.backend.modules.certificate.domain.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, String> {

    Optional<CertificateTemplate> findByExamTypeId(String examTypeId);

    boolean existsByExamTypeId(String examTypeId);

    List<CertificateTemplate> findByExamTypeIdIn(List<String> examTypeIds);
}
