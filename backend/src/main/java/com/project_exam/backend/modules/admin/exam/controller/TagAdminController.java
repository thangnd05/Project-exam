package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.TagRequest;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.service.TagService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/tags")
@RequiredArgsConstructor
public class TagAdminController {

    private final TagService tagService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<TagResponse> createTag(@RequestBody TagRequest request) {
        authUtils.requirePermission(PermissionCatalog.TAG_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(request));
    }

    @PutMapping("/{tagId}")
    public ResponseEntity<TagResponse> updateTag(
            @PathVariable String tagId,
            @RequestBody TagRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.TAG_MANAGE);
        return ResponseEntity.ok(tagService.updateTag(tagId, request));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable String tagId) {
        authUtils.requirePermission(PermissionCatalog.TAG_MANAGE);
        tagService.deleteTag(tagId);
        return ResponseEntity.noContent().build();
    }
}
