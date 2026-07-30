package com.project_exam.backend.modules.vocabulary.word.repository;

import com.project_exam.backend.modules.vocabulary.word.domain.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, String> {
    List<Vocabulary> findByAlbumId(String albumId);

    @Query("SELECT v.albumId, COUNT(v) FROM Vocabulary v WHERE v.albumId IN :albumIds GROUP BY v.albumId")
    List<Object[]> countGroupedByAlbumIds(@Param("albumIds") Collection<String> albumIds);

}
