package com.project_exam.backend.modules.assessment.test.controller;

import com.project_exam.backend.modules.assessment.test.dto.TestPartRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSimpleResponse;
import com.project_exam.backend.modules.assessment.test.service.TestPartService;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<TestPartSimpleResponse> createTestPart(
            @Valid @RequestBody TestPartRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(testPartService.saveResponse(request, httpRequest));
    }

    // CẬP NHẬT DÙNG DTO
    @PutMapping("/{id}")
    public ResponseEntity<TestPartSimpleResponse> updateTestPart(
            @PathVariable String id,
            @Valid @RequestBody TestPartRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(testPartService.updateResponse(id, request, httpRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestPart(@PathVariable String id, HttpServletRequest httpRequest) {
        testPartService.deleteById(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}