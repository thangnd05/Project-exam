package com.project_exam.backend.modules.posts.comment.repository;

import com.project_exam.backend.modules.posts.comment.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    // Top-level comments (không phải reply)
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(String postId);
    List<Comment> findByPostIdOrderByCreatedAtAsc(String postId);
    // Replies của một comment
    List<Comment> findByParentIdOrderByCreatedAtAsc(String parentId);
    long countByPostId(String postId);
    /** Batch count theo nhiều postId 1 lần — tránh N+1 trong list post. */
    @Query("SELECT c.postId, COUNT(c) FROM Comment c WHERE c.postId IN :postIds GROUP BY c.postId")
    List<Object[]> countGroupedByPostIdIn(@Param("postIds") java.util.Collection<String> postIds);
    @Transactional
    @Modifying
    void deleteByPostId(String postId);
}
