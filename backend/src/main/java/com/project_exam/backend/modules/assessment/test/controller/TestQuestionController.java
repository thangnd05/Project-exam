package com.project_exam.backend.modules.assessment.test.controller;

import com.project_exam.backend.modules.assessment.test.dto.TestQuestionResponse;
import com.project_exam.backend.modules.assessment.test.service.TestQuestionService;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-questions")
@RequiredArgsConstructor
public class TestQuestionController {

    private final TestQuestionService testQuestionService;

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

}
