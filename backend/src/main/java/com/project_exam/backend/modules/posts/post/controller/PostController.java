package com.project_exam.backend.modules.posts.post.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.posts.post.dto.PostUpsertRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.posts.post.dto.PostResponse;
import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.post.dto.UpdatePostStatusRequest;
import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.posts.post.service.PostService;
import com.project_exam.backend.modules.posts.post.service.PostViewThrottleService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostViewThrottleService postViewThrottleService;
    private final AuthUtils authUtils;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<PageResponse<PostSummaryResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Post.PostStatus status,
            @RequestParam(required = false) String categoryId
    ) {
        return ResponseEntity.ok(postService.getPostsPaged(page, size, keyword, status, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = null;
        try {
            currentUserId = authUtils.getUserId(httpRequest);
        } catch (Exception ignored) {
        }
        String clientIp = postViewThrottleService.extractClientIp(httpRequest);
        return ResponseEntity.ok(postService.getPostById(id, currentUserId, clientIp));
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<PostSummaryResponse>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Post.PostStatus status,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(postService.getMyPosts(page, size, keyword, status, userId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestPart("post") String requestJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
            HttpServletRequest httpRequest
    ) {
        try {
            PostUpsertRequest request = objectMapper.readValue(requestJson, PostUpsertRequest.class);
            String userId = authUtils.getUserId(httpRequest);
            return ResponseEntity.ok(postService.createPost(request, thumbnailFile, userId));
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable String id,
            @RequestPart("post") String requestJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
            HttpServletRequest httpRequest
    ) {
        try {
            PostUpsertRequest request = objectMapper.readValue(requestJson, PostUpsertRequest.class);
            String userId = authUtils.getUserId(httpRequest);
            return ResponseEntity.ok(postService.updatePost(id, request, thumbnailFile, userId));
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        postService.deletePost(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PostResponse> updatePostStatus(
            @PathVariable String id,
            @RequestBody UpdatePostStatusRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(postService.updatePostStatus(id, request.getStatus(), userId));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile image) {
        try {
            String url = postService.uploadImage(image);
            return ResponseEntity.ok(java.util.Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Upload failed"));
        }
    }
}
