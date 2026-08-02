package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-categories")
@RequiredArgsConstructor
public class ExamCategoryController {

    private final ExamCategoryService examCategoryService;

    @GetMapping
    public ResponseEntity<List<ExamCategoryResponse>> getAll() {
        return ResponseEntity.ok(examCategoryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamCategoryResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(examCategoryService.findById(id));
    }

    @GetMapping("/by-code/{code}")
    public ResponseEntity<ExamCategoryResponse> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(examCategoryService.findByCode(code));
    }

    @PostMapping
    public ResponseEntity<ExamCategoryResponse> create(@Valid @RequestBody ExamCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examCategoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamCategoryResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ExamCategoryRequest request
    ) {
        return ResponseEntity.ok(examCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        examCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
