package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.ExamPartRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamPartService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-parts")
@RequiredArgsConstructor
public class ExamPartController {

    private final ExamPartService examPartService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<ExamPartResponse>> getAllExamParts() {
        return ResponseEntity.ok(examPartService.findAll());
    }

    @GetMapping("/by-exam-type/{examTypeId}")
    public ResponseEntity<List<ExamPartResponse>> getExamPartsByExamType(@PathVariable String examTypeId) {
        return ResponseEntity.ok(examPartService.findByExamTypeId(examTypeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamPartResponse> getExamPartById(@PathVariable String id) {
        return ResponseEntity.ok(examPartService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ExamPartResponse> createExamPart(
            @Valid @RequestBody ExamPartRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_PART_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(examPartService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamPartResponse> updateExamPart(
            @PathVariable String id,
            @Valid @RequestBody ExamPartRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.EXAM_PART_MANAGE);
        return ResponseEntity.ok(examPartService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamPart(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EXAM_PART_MANAGE);
        examPartService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
