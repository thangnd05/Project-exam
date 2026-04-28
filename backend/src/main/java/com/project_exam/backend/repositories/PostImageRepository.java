package com.project_exam.backend.repositories;

import com.project_exam.backend.models.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, String> {
    List<PostImage> findByPostIdOrderByOrder(String postId);
    @Transactional
    @Modifying
    void deleteByPostId(String postId);
}
