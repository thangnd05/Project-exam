package com.project_exam.backend.modules.posts.repository;

import com.project_exam.backend.modules.posts.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, String>, JpaSpecificationExecutor<Post> {
    List<Post> findByUserId(String userId);
    List<Post> findByStatus(Post.PostStatus status);
}
