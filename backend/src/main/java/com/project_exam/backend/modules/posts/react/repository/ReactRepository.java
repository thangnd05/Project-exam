package com.project_exam.backend.modules.posts.react.repository;

import com.project_exam.backend.modules.posts.react.domain.React;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactRepository extends JpaRepository<React, String> {
    Optional<React> findByPostIdAndUserId(String postId, String userId);
    List<React> findByPostId(String postId);
    long countByPostId(String postId);
    long countByPostIdAndType(String postId, React.ReactType type);
    /** Batch count theo nhiều postId 1 lần — tránh N+1 trong list post. */
    @Query("SELECT r.postId, COUNT(r) FROM React r WHERE r.postId IN :postIds GROUP BY r.postId")
    List<Object[]> countGroupedByPostIdIn(@Param("postIds") java.util.Collection<String> postIds);
    void deleteByPostIdAndUserId(String postId, String userId);
}
