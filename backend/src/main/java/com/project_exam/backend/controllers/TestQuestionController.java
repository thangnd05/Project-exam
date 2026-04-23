package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.TestQuestionRequest;
import com.project_exam.backend.dto.response.TestQuestionResponse;
import com.project_exam.backend.services.ExamAndTest.TestQuestionService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-questions")
@AllArgsConstructor
public class TestQuestionController {

    private final TestQuestionService testQuestionService;

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
    public ResponseEntity<TestQuestionResponse> createTestQuestion(@RequestBody TestQuestionRequest request) {
        return ResponseEntity.ok(testQuestionService.createTestQuestion(request));
    }

    // Cập nhật test question
    @PutMapping("/{id}")
    public ResponseEntity<TestQuestionResponse> updateTestQuestion(
            @PathVariable String id,
            @RequestBody TestQuestionRequest request) {
        return testQuestionService.updateTestQuestion(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Xóa test question
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTestQuestion(@PathVariable String id) {
        return testQuestionService.getTestQuestionById(id)
                .map(existing -> {
                    testQuestionService.deleteTestQuestionById(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
