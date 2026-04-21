package com.project_exam.backend.controllers;

import com.project_exam.backend.models.TestQuestion;
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
    public ResponseEntity<List<TestQuestion>> getAllTestQuestions() {
        return ResponseEntity.ok(testQuestionService.getAllTestQuestions());
    }

    // Lấy test question theo id
    @GetMapping("/{id}")
    public ResponseEntity<TestQuestion> getTestQuestionById(@PathVariable String id) {
        return testQuestionService.getTestQuestionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Tạo mới test question
    @PostMapping
    public ResponseEntity<TestQuestion> createTestQuestion(@RequestBody TestQuestion testQuestion) {
        return ResponseEntity.ok(testQuestionService.saveTestQuestion(testQuestion));
    }

    // Cập nhật test question
    @PutMapping("/{id}")
    public ResponseEntity<TestQuestion> updateTestQuestion(
            @PathVariable String id,
            @RequestBody TestQuestion updatedTestQuestion) {
        return testQuestionService.getTestQuestionById(id)
                .map(existing -> {
                    updatedTestQuestion.setTestQuestionId(id);
                    return ResponseEntity.ok(testQuestionService.saveTestQuestion(updatedTestQuestion));
                })
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
