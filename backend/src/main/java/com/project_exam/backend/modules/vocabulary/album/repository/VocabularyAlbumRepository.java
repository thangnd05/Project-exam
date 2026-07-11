package com.project_exam.backend.modules.vocabulary.album.repository;

import com.project_exam.backend.modules.vocabulary.album.domain.VocabularyAlbum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyAlbumRepository extends JpaRepository<VocabularyAlbum, String> {

    List<VocabularyAlbum> findAllByUserId(String userId);
}
