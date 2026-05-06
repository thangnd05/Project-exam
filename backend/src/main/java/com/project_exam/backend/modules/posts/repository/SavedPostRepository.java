package com.project_exam.backend.modules.posts.repository;

import com.project_exam.backend.modules.posts.domain.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, String> {
    Optional<SavedPost> findByPostIdAndUserId(String postId, String userId);
    boolean existsByPostIdAndUserId(String postId, String userId);
    long countByPostId(String postId);
    List<SavedPost> findByUserIdOrderByCreatedAtDesc(String userId);
    void deleteByPostId(String postId);
    void deleteByUserId(String userId);
}
