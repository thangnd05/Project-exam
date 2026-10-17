package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamCategoryService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.EXAM_CATEGORY_MANAGE)
@RequestMapping("/api/admin/exam-categories")
@RequiredArgsConstructor
public class ExamCategoryAdminController {

    private final ExamCategoryService examCategoryService;

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
