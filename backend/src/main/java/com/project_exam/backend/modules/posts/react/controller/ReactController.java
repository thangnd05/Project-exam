package com.project_exam.backend.modules.posts.react.controller;

import com.project_exam.backend.modules.posts.react.dto.ReactRequest;
import com.project_exam.backend.modules.posts.react.dto.ReactSummaryResponse;
import com.project_exam.backend.modules.posts.react.service.ReactService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/reacts")
@RequiredArgsConstructor
public class ReactController {

    private final ReactService reactService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<ReactSummaryResponse> getReacts(
            @PathVariable String postId,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = null;
        try {
            currentUserId = authUtils.getUserId(httpRequest);
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(reactService.getReactSummary(postId, currentUserId));
    }

    @PostMapping
    public ResponseEntity<ReactSummaryResponse> toggleReact(
            @PathVariable String postId,
            @RequestBody ReactRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(reactService.toggleReact(postId, request, userId));
    }
}
