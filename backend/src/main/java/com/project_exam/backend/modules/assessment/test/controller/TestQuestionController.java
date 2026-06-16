package com.project_exam.backend.modules.assessment.test.controller;

import com.project_exam.backend.modules.assessment.test.dto.TestQuestionRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestQuestionResponse;
import com.project_exam.backend.modules.assessment.test.service.TestQuestionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-questions")
@RequiredArgsConstructor
public class TestQuestionController {

    private final TestQuestionService testQuestionService;
    private final AuthUtils authUtils;

    // Lấy tất cả test questions
    @GetMapping
    public ResponseEntity<List<TestQuestionResponse>> getAllTestQuestions() {
        return ResponseEntity.ok(testQuestionService.getAllTestQuestionResponses());
    }

    // Lấy test question theo id
    @GetMapping("/{id}")
    public ResponseEntity<TestQuestionResponse> getTestQuestionById(@PathVariable String id) {
        return testQuestionService.getTestQuestionResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Tạo mới test question
    @PostMapping
    public ResponseEntity<TestQuestionResponse> createTestQuestion(@Valid @RequestBody TestQuestionRequest request) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.ok(testQuestionService.createTestQuestion(request));
    }

    // Cập nhật test question
    @PutMapping("/{id}")
    public ResponseEntity<TestQuestionResponse> updateTestQuestion(
            @PathVariable String id,
            @Valid @RequestBody TestQuestionRequest request) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return testQuestionService.updateTestQuestion(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Xóa test question
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestQuestion(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        if (testQuestionService.getTestQuestionById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        testQuestionService.deleteTestQuestionById(id);
        return ResponseEntity.noContent().build();
    }
}
