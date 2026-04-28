package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    // Top-level comments (không phải reply)
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(String postId);
    // Replies của một comment
    List<Comment> findByParentIdOrderByCreatedAtAsc(String parentId);
    long countByPostId(String postId);
    @Transactional
    @Modifying
    void deleteByPostId(String postId);
}
