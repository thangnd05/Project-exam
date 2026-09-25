package com.project_exam.backend.modules.admin.posts.controller;

import com.project_exam.backend.modules.posts.post.dto.PostResponse;
import com.project_exam.backend.modules.posts.post.dto.UpdatePostStatusRequest;
import com.project_exam.backend.modules.posts.post.service.PostService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class PostAdminController {

    private final PostService postService;
    private final AuthUtils authUtils;

    @PatchMapping("/{id}/status")
    public ResponseEntity<PostResponse> updatePostStatus(
            @PathVariable String id,
            @RequestBody UpdatePostStatusRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.POST_MODERATE);
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(postService.updatePostStatus(id, request.getStatus(), userId));
    }
}
