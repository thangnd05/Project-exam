package com.project_exam.backend.modules.posts.controller;

import com.project_exam.backend.modules.posts.dto.CategoryRequest;
import com.project_exam.backend.modules.posts.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.service.CategoryService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Category dùng chung cho post. GET mở (frontend hiển thị), CUD admin-only —
 * tránh user xoá category đang gắn vào nhiều bài viết.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(categoryService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable String id,
            @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
