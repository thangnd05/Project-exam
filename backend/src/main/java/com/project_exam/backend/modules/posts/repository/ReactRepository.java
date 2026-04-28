package com.project_exam.backend.modules.posts.repository;

import com.project_exam.backend.modules.posts.domain.React;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactRepository extends JpaRepository<React, String> {
    Optional<React> findByPostIdAndUserId(String postId, String userId);
    List<React> findByPostId(String postId);
    long countByPostIdAndType(String postId, React.ReactType type);
    void deleteByPostIdAndUserId(String postId, String userId);
}
