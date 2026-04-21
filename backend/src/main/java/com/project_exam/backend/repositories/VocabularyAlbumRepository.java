package com.project_exam.backend.repositories;

import com.project_exam.backend.models.VocabularyAlbum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyAlbumRepository extends JpaRepository<VocabularyAlbum, String> {

    List<VocabularyAlbum> findAllByUserId(String userId);
}
