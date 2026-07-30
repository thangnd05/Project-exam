package com.project_exam.backend.modules.posts.comment.repository;

import com.project_exam.backend.modules.posts.comment.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {

    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(String postId);
    List<Comment> findByPostIdOrderByCreatedAtAsc(String postId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(String parentId);
    long countByPostId(String postId);

    @Query("SELECT c.postId, COUNT(c) FROM Comment c WHERE c.postId IN :postIds GROUP BY c.postId")
    List<Object[]> countGroupedByPostIdIn(@Param("postIds") java.util.Collection<String> postIds);
    @Transactional
    @Modifying
    void deleteByPostId(String postId);
}
