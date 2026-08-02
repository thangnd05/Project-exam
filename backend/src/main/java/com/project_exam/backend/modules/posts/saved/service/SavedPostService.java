package com.project_exam.backend.modules.posts.saved.service;
import com.project_exam.backend.modules.posts.post.service.PostService;

import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.posts.saved.domain.SavedPost;
import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.saved.dto.SavedPostStatusResponse;
import com.project_exam.backend.modules.posts.saved.mapper.SavedPostMapper;
import com.project_exam.backend.modules.posts.post.repository.PostRepository;
import com.project_exam.backend.modules.posts.saved.repository.SavedPostRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final SavedPostMapper savedPostMapper;

    @Transactional
    public SavedPostStatusResponse toggleSave(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));
        if (post.getStatus() != Post.PostStatus.APPROVED) {
            throw new NotFoundException("Post không tồn tại");
        }

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

    public SavedPostStatusResponse getStatus(String postId, String userId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }
        boolean saved = userId != null && savedPostRepository.existsByPostIdAndUserId(postId, userId);
        long count = savedPostRepository.countByPostId(postId);
        return savedPostMapper.toStatusResponse(saved, count);
    }

    public PageResponse<PostSummaryResponse> getMySavedPosts(int page, int size, String keyword,
                                                             String userId) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        String normalizedKeyword = (keyword == null) ? "" : keyword.trim();

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<Post> savedPage = savedPostRepository.findSavedApprovedPosts(
                userId, Post.PostStatus.APPROVED, normalizedKeyword, pageable);

        return PageResponse.from(savedPage, postService.buildSummaryResponses(savedPage.getContent()));
    }
}
