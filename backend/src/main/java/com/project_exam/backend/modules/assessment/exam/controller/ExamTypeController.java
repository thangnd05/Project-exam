package com.project_exam.backend.modules.assessment.exam.controller;

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

/**
 * ExamType là reference data toàn hệ thống (TOEIC, IELTS…). GET mở để frontend hiển thị,
 * nhưng CUD phải admin để tránh user phá scoring/metadata của mọi đề trong hệ thống.
 */
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

    /** Loại kỳ thi chuẩn (flexible=false) — dùng cho trang chọn loại đề, ẩn loại linh hoạt. */
    @GetMapping("/standard")
    public ResponseEntity<List<ExamTypeResponse>> getStandardExamTypes() {
        return ResponseEntity.ok(examTypeService.findStandard());
    }

    /** Loại kỳ thi linh hoạt (flexible=true). */
    @GetMapping("/flexible")
    public ResponseEntity<List<ExamTypeResponse>> getFlexibleExamTypes() {
        return ResponseEntity.ok(examTypeService.findFlexible());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> getExamTypeById(@PathVariable String id) {
        return ResponseEntity.ok(examTypeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ExamTypeResponse> createExamType(
            @Valid @RequestBody ExamTypeRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(
            @PathVariable String id,
            @Valid @RequestBody ExamTypeRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(examTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        examTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
