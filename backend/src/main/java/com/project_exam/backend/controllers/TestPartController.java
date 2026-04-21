package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.TestPartRequest;
import com.project_exam.backend.models.TestPart;
import com.project_exam.backend.services.ExamAndTest.TestPartService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-parts")
@AllArgsConstructor
public class TestPartController {

    private final TestPartService testPartService;

    @GetMapping
    public ResponseEntity<List<TestPart>> getAllTestParts() {
        return ResponseEntity.ok(testPartService.findAll());
    }

    @GetMapping("/by-test/{testId}")
    public ResponseEntity<List<TestPart>> getTestPartsByTestId(@PathVariable String testId) {
        return ResponseEntity.ok(testPartService.findByTestId(testId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestPart> getTestPartById(@PathVariable String id) {
        return testPartService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // TẠO MỚI DÙNG DTO
    @PostMapping
    public ResponseEntity<?> createTestPart(@RequestBody TestPartRequest request) {
        try {
            TestPart saved = testPartService.save(request);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // CẬP NHẬT DÙNG DTO
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTestPart(@PathVariable String id, @RequestBody TestPartRequest request) {
        try {
            TestPart updated = testPartService.update(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTestPart(@PathVariable String id) {
        testPartService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}