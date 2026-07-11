package com.project_exam.backend.modules.vocabulary.word.repository;

import com.project_exam.backend.modules.vocabulary.word.domain.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, String> {
    List<Vocabulary> findByAlbumId(String albumId);

}
