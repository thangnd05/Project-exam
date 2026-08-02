package com.project_exam.backend.modules.posts.saved.controller;

import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.saved.dto.SavedPostStatusResponse;
import com.project_exam.backend.modules.posts.saved.service.SavedPostService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;
    private final AuthUtils authUtils;

    @GetMapping("/saved")
    public ResponseEntity<PageResponse<PostSummaryResponse>> getMySaved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(savedPostService.getMySavedPosts(page, size, keyword, userId));
    }

    @GetMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> getSaveStatus(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        String userId = null;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(savedPostService.getStatus(postId, userId));
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> toggleSave(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(savedPostService.toggleSave(postId, userId));
    }
}
