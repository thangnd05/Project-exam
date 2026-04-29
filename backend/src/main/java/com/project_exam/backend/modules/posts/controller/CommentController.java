package com.project_exam.backend.modules.posts.controller;

import com.project_exam.backend.modules.posts.dto.CommentRequest;
import com.project_exam.backend.modules.posts.dto.CommentResponse;
import com.project_exam.backend.modules.posts.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // ─── GET comments theo post (public) ─────────
    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }

    // ─── POST thêm comment/reply (auth) ──────────
    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String postId,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(commentService.addComment(postId, request, httpRequest));
    }

    // ─── PUT sửa comment (auth, owner only) ──────
    @PutMapping("/api/comments/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String id,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(commentService.updateComment(id, request, httpRequest));
    }

    // ─── DELETE xóa comment (auth, owner only) ───
    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        commentService.deleteComment(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
