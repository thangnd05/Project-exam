package com.project_exam.backend.modules.posts.service;

import com.project_exam.backend.modules.posts.domain.Post;
import com.project_exam.backend.modules.posts.domain.SavedPost;
import com.project_exam.backend.modules.posts.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.dto.SavedPostStatusResponse;
import com.project_exam.backend.modules.posts.mapper.SavedPostMapper;
import com.project_exam.backend.modules.posts.repository.PostRepository;
import com.project_exam.backend.modules.posts.repository.SavedPostRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final AuthUtils authUtils;
    private final SavedPostMapper savedPostMapper;

    /**
     * Toggle save:
     * - Chưa save → tạo mới
     * - Đã save → xóa
     */
    @Transactional
    public SavedPostStatusResponse toggleSave(String postId, HttpServletRequest httpRequest) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));
        if (post.getStatus() != Post.PostStatus.APPROVED) {
            throw new NotFoundException("Post không tồn tại");
        }

        String userId = authUtils.getUserId(httpRequest);
        Optional<SavedPost> existing = savedPostRepository.findByPostIdAndUserId(postId, userId);

        boolean nowSaved;
        if (existing.isPresent()) {
            savedPostRepository.delete(existing.get());
            nowSaved = false;
        } else {
            savedPostRepository.save(SavedPost.builder()
                    .postId(postId)
                    .userId(userId)
                    .build());
            nowSaved = true;
        }

        long count = savedPostRepository.countByPostId(postId);
        return savedPostMapper.toStatusResponse(nowSaved, count);
    }

    public SavedPostStatusResponse getStatus(String postId, HttpServletRequest httpRequest) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }
        String userId = tryGetUserId(httpRequest);
        boolean saved = userId != null && savedPostRepository.existsByPostIdAndUserId(postId, userId);
        long count = savedPostRepository.countByPostId(postId);
        return savedPostMapper.toStatusResponse(saved, count);
    }

    public List<PostSummaryResponse> getMySavedPosts(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        List<SavedPost> saved = savedPostRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return saved.stream()
                .map(s -> postRepository.findById(s.getPostId()).orElse(null))
                .filter(p -> p != null && p.getStatus() == Post.PostStatus.APPROVED)
                .map(postService::toSummaryResponse)
                .collect(Collectors.toList());
    }

    private String tryGetUserId(HttpServletRequest httpRequest) {
        try {
            return authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            return null;
        }
    }
}
