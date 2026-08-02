package com.project_exam.backend.modules.assessment.test.controller;

import com.project_exam.backend.modules.assessment.test.dto.TestQuestionRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestQuestionResponse;
import com.project_exam.backend.modules.assessment.test.service.TestQuestionService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-questions")
@RequiredArgsConstructor
public class TestQuestionController {

    private final TestQuestionService testQuestionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<TestQuestionResponse>> getAllTestQuestions() {
        return ResponseEntity.ok(testQuestionService.getAllTestQuestionResponses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestQuestionResponse> getTestQuestionById(@PathVariable String id) {
        TestQuestionResponse response = testQuestionService.getTestQuestionResponseById(id)
                .orElseThrow(() -> new NotFoundException("Test question không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TestQuestionResponse> createTestQuestion(@Valid @RequestBody TestQuestionRequest request) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(testQuestionService.createTestQuestion(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestQuestionResponse> updateTestQuestion(
            @PathVariable String id,
            @Valid @RequestBody TestQuestionRequest request) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        TestQuestionResponse response = testQuestionService.updateTestQuestion(id, request)
                .orElseThrow(() -> new NotFoundException("Test question không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestQuestion(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        if (testQuestionService.getTestQuestionById(id).isEmpty()) {
            throw new NotFoundException("Test question không tồn tại");
        }
        testQuestionService.deleteTestQuestionById(id);
        return ResponseEntity.noContent().build();
    }
}
