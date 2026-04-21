package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ExamTypeRequest;
import com.project_exam.backend.dto.response.ExamTypeResponse;
import com.project_exam.backend.services.ExamAndTest.ExamTypeService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-types")
@AllArgsConstructor
public class ExamTypeController {

    private final ExamTypeService examTypeService;

    @GetMapping
    public ResponseEntity<List<ExamTypeResponse>> getAllExamTypes() {
        return ResponseEntity.ok(examTypeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> getExamTypeById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(examTypeService.findById(id));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ExamTypeResponse> createExamType(@RequestBody ExamTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(@PathVariable String id, @RequestBody ExamTypeRequest request) {
        try {
            return ResponseEntity.ok(examTypeService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable String id) {
        try {
            examTypeService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }
}
