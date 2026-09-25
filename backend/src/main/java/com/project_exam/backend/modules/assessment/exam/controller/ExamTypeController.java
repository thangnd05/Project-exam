package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-types")
@RequiredArgsConstructor
public class ExamTypeController {

    private final ExamTypeService examTypeService;

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

}
