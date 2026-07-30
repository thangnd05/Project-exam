package com.project_exam.backend.modules.posts.saved.controller;

import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.saved.dto.SavedPostStatusResponse;
import com.project_exam.backend.modules.posts.saved.service.SavedPostService;
import com.project_exam.backend.shared.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;

    @GetMapping("/saved")
    public ResponseEntity<PageResponse<PostSummaryResponse>> getMySaved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.getMySavedPosts(page, size, keyword, httpRequest));
    }

    @GetMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> getSaveStatus(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.getStatus(postId, httpRequest));
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> toggleSave(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.toggleSave(postId, httpRequest));
    }
}
