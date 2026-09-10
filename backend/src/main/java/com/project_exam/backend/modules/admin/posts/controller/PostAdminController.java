package com.project_exam.backend.modules.admin.posts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.posts.post.dto.ImageUploadResponse;
import com.project_exam.backend.modules.posts.post.dto.PostUpsertRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.posts.post.dto.PostResponse;
import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import com.project_exam.backend.modules.posts.post.dto.UpdatePostStatusRequest;
import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.posts.post.service.PostService;
import com.project_exam.backend.modules.posts.post.service.PostViewThrottleService;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * Mặt quản trị của posts, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
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
