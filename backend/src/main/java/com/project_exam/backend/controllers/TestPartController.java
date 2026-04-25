package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.TestPartRequest;
import com.project_exam.backend.dto.response.TestPartSimpleResponse;
import com.project_exam.backend.services.ExamAndTest.TestPartService;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<TestPartSimpleResponse>> getAllTestParts() {
        return ResponseEntity.ok(testPartService.findAllResponses());
    }

    @GetMapping("/by-test/{testId}")
    public ResponseEntity<List<TestPartSimpleResponse>> getTestPartsByTestId(@PathVariable String testId) {
        return ResponseEntity.ok(testPartService.findResponsesByTestId(testId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestPartSimpleResponse> getTestPartById(@PathVariable String id) {
        return testPartService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // TẠO MỚI DÙNG DTO
    @PostMapping
    public ResponseEntity<TestPartSimpleResponse> createTestPart(@Valid @RequestBody TestPartRequest request) {
        return ResponseEntity.ok(testPartService.saveResponse(request));
    }

    // CẬP NHẬT DÙNG DTO
    @PutMapping("/{id}")
    public ResponseEntity<TestPartSimpleResponse> updateTestPart(
            @PathVariable String id,
            @Valid @RequestBody TestPartRequest request
    ) {
        return ResponseEntity.ok(testPartService.updateResponse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestPart(@PathVariable String id) {
        testPartService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}