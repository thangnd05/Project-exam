package com.project_exam.backend.modules.posts.repository;

import com.project_exam.backend.modules.posts.domain.Post;
import com.project_exam.backend.modules.posts.domain.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, String> {
    Optional<SavedPost> findByPostIdAndUserId(String postId, String userId);
    boolean existsByPostIdAndUserId(String postId, String userId);
    long countByPostId(String postId);
    /** Batch count theo nhiều postId 1 lần — tránh N+1 trong list post. */
    @Query("SELECT sp.postId, COUNT(sp) FROM SavedPost sp WHERE sp.postId IN :postIds GROUP BY sp.postId")
    List<Object[]> countGroupedByPostIdIn(@Param("postIds") java.util.Collection<String> postIds);
    List<SavedPost> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Bài đã lưu (chỉ APPROVED) của user, lọc theo keyword tiêu đề, sắp theo thời điểm lưu mới nhất.
     * Trả thẳng Post để build summary; phân trang qua Pageable (không truyền Sort vì đã ORDER BY trong query).
     */
    @Query(value = "SELECT p FROM SavedPost sp, Post p "
            + "WHERE p.id = sp.postId AND sp.userId = :userId "
            + "AND p.status = :status "
            + "AND LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "ORDER BY sp.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM SavedPost sp, Post p "
            + "WHERE p.id = sp.postId AND sp.userId = :userId "
            + "AND p.status = :status "
            + "AND LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Post> findSavedApprovedPosts(@Param("userId") String userId,
                                      @Param("status") Post.PostStatus status,
                                      @Param("keyword") String keyword,
                                      Pageable pageable);
    void deleteByPostId(String postId);
    void deleteByUserId(String userId);
}
