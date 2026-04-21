package com.project_exam.backend.repositories;

import com.project_exam.backend.models.PassageMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PassageMediaRepository extends JpaRepository<PassageMedia, String> {

    List<PassageMedia> findByPassageId(String passageId);

    void deleteByPassageId(String passageId);

    List<PassageMedia> findByPassageIdIn(Collection<String> passageIds);
}
