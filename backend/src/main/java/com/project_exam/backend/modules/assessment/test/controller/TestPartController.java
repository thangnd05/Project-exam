package com.project_exam.backend.modules.assessment.test.controller;

import com.project_exam.backend.modules.assessment.test.dto.TestPartRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSimpleResponse;
import com.project_exam.backend.modules.assessment.test.service.TestPartService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-parts")
@RequiredArgsConstructor
public class TestPartController {

    private final TestPartService testPartService;
    private final AuthUtils authUtils;

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
        TestPartSimpleResponse response = testPartService.findResponseById(id)
                .orElseThrow(() -> new NotFoundException("Test part không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TestPartSimpleResponse> createTestPart(
            @Valid @RequestBody TestPartRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(testPartService.saveResponse(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestPartSimpleResponse> updateTestPart(
            @PathVariable String id,
            @Valid @RequestBody TestPartRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(testPartService.updateResponse(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestPart(@PathVariable String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        testPartService.deleteById(id, userId);
        return ResponseEntity.noContent().build();
    }
}
