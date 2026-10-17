package com.project_exam.backend.modules.admin.posts.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import com.project_exam.backend.modules.posts.category.dto.CategoryRequest;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequirePermission(PermissionCatalog.POST_CATEGORY_MANAGE)
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable String id,
            @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
