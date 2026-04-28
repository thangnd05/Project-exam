package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.PassageMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PassageMediaRepository extends JpaRepository<PassageMedia, String> {

    List<PassageMedia> findByPassageId(String passageId);

    void deleteByPassageId(String passageId);

    List<PassageMedia> findByPassageIdIn(Collection<String> passageIds);
}
