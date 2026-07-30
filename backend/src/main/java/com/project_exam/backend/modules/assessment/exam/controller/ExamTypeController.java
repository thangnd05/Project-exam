package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-types")
@RequiredArgsConstructor
public class ExamTypeController {

    private final ExamTypeService examTypeService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<ExamTypeResponse>> getAllExamTypes() {
        return ResponseEntity.ok(examTypeService.findAll());
    }

    @GetMapping("/standard")
    public ResponseEntity<List<ExamTypeResponse>> getStandardExamTypes() {
        return ResponseEntity.ok(examTypeService.findStandard());
    }

    @GetMapping("/flexible")
    public ResponseEntity<List<ExamTypeResponse>> getFlexibleExamTypes() {
        return ResponseEntity.ok(examTypeService.findFlexible());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> getExamTypeById(@PathVariable String id) {
        return ResponseEntity.ok(examTypeService.findById(id));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<ExamTypeResponse>> getChildren(@PathVariable String id) {
        return ResponseEntity.ok(examTypeService.findChildren(id));
    }

    @PostMapping
    public ResponseEntity<ExamTypeResponse> createExamType(
            @Valid @RequestBody ExamTypeRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(
            @PathVariable String id,
            @Valid @RequestBody ExamTypeRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        return ResponseEntity.ok(examTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        examTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
