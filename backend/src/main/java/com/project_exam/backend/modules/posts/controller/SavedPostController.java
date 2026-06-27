package com.project_exam.backend.modules.posts.controller;

import com.project_exam.backend.modules.posts.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.dto.SavedPostStatusResponse;
import com.project_exam.backend.modules.posts.service.SavedPostService;
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

    // ─── GET danh sách bài đã lưu của user (auth) ─
    @GetMapping("/saved")
    public ResponseEntity<PageResponse<PostSummaryResponse>> getMySaved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.getMySavedPosts(page, size, keyword, httpRequest));
    }

    // ─── GET trạng thái save của 1 post (public) ──
    @GetMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> getSaveStatus(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.getStatus(postId, httpRequest));
    }

    // ─── POST toggle save (auth) ──────────────────
    @PostMapping("/{postId}/save")
    public ResponseEntity<SavedPostStatusResponse> toggleSave(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(savedPostService.toggleSave(postId, httpRequest));
    }
}
