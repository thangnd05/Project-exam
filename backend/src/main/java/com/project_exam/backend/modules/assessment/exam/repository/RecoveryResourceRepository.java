package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecoveryResourceRepository extends JpaRepository<RecoveryResource, String> {

    List<RecoveryResource> findByCreatedBy(String createdBy);

}
