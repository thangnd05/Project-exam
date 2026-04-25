package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ExamTypeRequest;
import com.project_exam.backend.dto.response.ExamTypeResponse;
import com.project_exam.backend.services.ExamAndTest.ExamTypeService;
import jakarta.validation.Valid;
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
        return ResponseEntity.ok(examTypeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ExamTypeResponse> createExamType(@Valid @RequestBody ExamTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(
            @PathVariable String id,
            @Valid @RequestBody ExamTypeRequest request
    ) {
        return ResponseEntity.ok(examTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable String id) {
        examTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
