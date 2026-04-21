package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, String> {
    List<Vocabulary> findByAlbumId(String albumId);

}
