package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Mặt quản trị của exam-types, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/exam-types")
@RequiredArgsConstructor
public class ExamTypeAdminController {

    private final ExamTypeService examTypeService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<ExamTypeResponse> createExamType(@Valid @RequestBody ExamTypeRequest request) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(
            @PathVariable String id,
            @Valid @RequestBody ExamTypeRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        return ResponseEntity.ok(examTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        examTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
