package com.project_exam.backend.modules.admin.posts.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.modules.posts.category.dto.CategoryRequest;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.category.service.CategoryService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryService categoryService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.POST_CATEGORY_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable String id,
            @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.POST_CATEGORY_MANAGE);
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.POST_CATEGORY_MANAGE);
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
