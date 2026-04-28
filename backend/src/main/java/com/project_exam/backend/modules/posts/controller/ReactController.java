package com.project_exam.backend.modules.posts.controller;

import com.project_exam.backend.modules.posts.dto.ReactRequest;
import com.project_exam.backend.modules.posts.dto.ReactSummaryResponse;
import com.project_exam.backend.modules.posts.service.ReactService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/reacts")
@RequiredArgsConstructor
public class ReactController {

    private final ReactService reactService;

    // ─── GET thống kê react (public) ─────────────
    @GetMapping
    public ResponseEntity<ReactSummaryResponse> getReacts(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(reactService.getReactSummary(postId, httpRequest));
    }

    // ─── POST toggle react (auth) ─────────────────
    @PostMapping
    public ResponseEntity<ReactSummaryResponse> toggleReact(
            @PathVariable String postId,
            @RequestBody ReactRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(reactService.toggleReact(postId, request, httpRequest));
    }
}
