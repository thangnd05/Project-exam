package com.project_exam.backend.modules.posts.post.repository;

import com.project_exam.backend.modules.posts.post.domain.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, String> {
    List<PostCategory> findByPostId(String postId);
    List<PostCategory> findByCategoryId(String categoryId);
    /** Batch fetch để tránh N+1 trong list post. */
    List<PostCategory> findByPostIdIn(java.util.Collection<String> postIds);
    @Transactional
    @Modifying
    void deleteByPostId(String postId);
    boolean existsByPostIdAndCategoryId(String postId, String categoryId);
}
