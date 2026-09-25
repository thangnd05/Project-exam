package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamCategoryService;
import lombok.RequiredArgsConstructor;
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

}
