package com.project_exam.backend.modules.posts.comment.controller;

import com.project_exam.backend.modules.posts.comment.dto.CommentRequest;
import com.project_exam.backend.modules.posts.comment.dto.CommentResponse;
import com.project_exam.backend.modules.posts.comment.service.CommentService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final AuthUtils authUtils;

    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String postId,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(commentService.addComment(postId, request, userId));
    }

    @PutMapping("/api/comments/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String id,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(commentService.updateComment(id, request, userId));
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        commentService.deleteComment(id, userId);
        return ResponseEntity.noContent().build();
    }
}
