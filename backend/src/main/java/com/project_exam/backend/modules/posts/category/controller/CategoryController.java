package com.project_exam.backend.modules.posts.category.controller;

import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(categoryService.findById(id));
    }

}
