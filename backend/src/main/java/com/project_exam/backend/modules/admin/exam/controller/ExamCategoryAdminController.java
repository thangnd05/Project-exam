package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamCategoryService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Mặt quản trị của exam-categories, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/exam-categories")
@RequiredArgsConstructor
public class ExamCategoryAdminController {

    private final ExamCategoryService examCategoryService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<ExamCategoryResponse> create(@Valid @RequestBody ExamCategoryRequest request) {
        authUtils.requirePermission(PermissionCatalog.EXAM_CATEGORY_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(examCategoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamCategoryResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ExamCategoryRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_CATEGORY_MANAGE);
        return ResponseEntity.ok(examCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.EXAM_CATEGORY_MANAGE);
        examCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
