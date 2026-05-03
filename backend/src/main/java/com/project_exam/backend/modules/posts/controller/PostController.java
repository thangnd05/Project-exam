package com.project_exam.backend.modules.posts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.posts.dto.PostUpsertRequest;
import com.project_exam.backend.modules.posts.dto.PostPageResponse;
import com.project_exam.backend.modules.posts.dto.PostResponse;
import com.project_exam.backend.modules.posts.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.domain.Post;
import com.project_exam.backend.modules.posts.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ObjectMapper objectMapper;

    // ─── GET danh sách (public) ───────────────────
    @GetMapping
    public ResponseEntity<PostPageResponse> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Post.PostStatus status,
            @RequestParam(required = false) String categoryId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(postService.getPostsPaged(page, size, keyword, status, categoryId, httpRequest));
    }

    // ─── GET chi tiết (public) ────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(postService.getPostById(id, httpRequest));
    }

    // ─── GET posts của tôi (auth) ─────────────────
    @GetMapping("/me")
    public ResponseEntity<List<PostSummaryResponse>> getMyPosts(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(postService.getMyPosts(httpRequest));
    }

    // ─── CREATE (auth) — MULTIPART ────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestPart("post") String requestJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
            HttpServletRequest httpRequest
    ) {
        try {
            PostUpsertRequest request = objectMapper.readValue(requestJson, PostUpsertRequest.class);
            return ResponseEntity.ok(postService.createPost(request, thumbnailFile, httpRequest));
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ─── UPDATE (auth, owner only) — MULTIPART ────────
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable String id,
            @RequestPart("post") String requestJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
            HttpServletRequest httpRequest
    ) {
        try {
            PostUpsertRequest request = objectMapper.readValue(requestJson, PostUpsertRequest.class);
            return ResponseEntity.ok(postService.updatePost(id, request, thumbnailFile, httpRequest));
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ─── DELETE (auth, owner only) ────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        postService.deletePost(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
