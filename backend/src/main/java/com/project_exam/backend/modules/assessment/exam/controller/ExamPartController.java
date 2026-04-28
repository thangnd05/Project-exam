package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamPartRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamPartService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-parts")
@AllArgsConstructor
public class ExamPartController {

    private final ExamPartService examPartService;

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
