package com.project_exam.backend.modules.vocabulary.repository;

import com.project_exam.backend.modules.vocabulary.domain.UserVocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, String> {
    Optional<UserVocabulary> findByUserIdAndVocabId(String userId, String vocabId);
    long countByUserId(String userId);
    long countByUserIdAndStatus(String userId, UserVocabulary.Status status);

    @Query("SELECT uv FROM UserVocabulary uv " +
            "JOIN Vocabulary v ON uv.vocabId = v.vocabId " +
            "WHERE uv.userId = :userId " +
            "AND v.albumId = :albumId " +
            "AND uv.status <> :status")
    List<UserVocabulary> findByUserIdAndAlbumIdAndStatusNot(
            @Param("userId") String userId,
            @Param("albumId") String albumId,
            @Param("status") UserVocabulary.Status status
    );

    // Nếu muốn filter cả album
    @Query("SELECT uv.vocabId FROM UserVocabulary uv WHERE uv.userId = :userId AND uv.status = 'mastered' AND uv.vocabId IN (SELECT v.vocabId FROM Vocabulary v WHERE v.albumId = :albumId)")
    List<String> findMasteredVocabIdsByUserIdAndAlbumId(@Param("userId") String userId, @Param("albumId") String albumId);

    @Query("SELECT uv.vocabId FROM UserVocabulary uv WHERE uv.userId = :userId AND uv.status = :status")
    List<String> findVocabIdsByUserIdAndStatus(@Param("userId") String userId, @Param("status") UserVocabulary.Status status);

}
