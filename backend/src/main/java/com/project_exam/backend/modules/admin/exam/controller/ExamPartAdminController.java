package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamPartRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamPartService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.EXAM_PART_MANAGE)
@RequestMapping("/api/admin/exam-parts")
@RequiredArgsConstructor
public class ExamPartAdminController {

    private final ExamPartService examPartService;

    @PostMapping
    public ResponseEntity<ExamPartResponse> createExamPart(@Valid @RequestBody ExamPartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examPartService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamPartResponse> updateExamPart(
            @PathVariable String id,
            @Valid @RequestBody ExamPartRequest request
    ) {
        return ResponseEntity.ok(examPartService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamPart(@PathVariable String id) {
        examPartService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
