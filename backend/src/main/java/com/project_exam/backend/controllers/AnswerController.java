package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.AnswerRequest;
import com.project_exam.backend.dto.response.admin.AnswerAdminResponse;
import com.project_exam.backend.services.ExamAndTest.AnswerService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers")
@AllArgsConstructor
public class AnswerController {
    private final AnswerService answerService;

    @GetMapping
    public ResponseEntity<List<AnswerAdminResponse>> getAllAnswer() {
        return ResponseEntity.ok(answerService.findAllResponses());
    }

    @GetMapping("/by-question/{questionId}")
    public ResponseEntity<List<AnswerAdminResponse>> getAnswersByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(answerService.findResponsesByQuestionId(questionId));
    }

    @PostMapping
    public ResponseEntity<AnswerAdminResponse> createAnswer(@RequestBody AnswerRequest request) {
        return ResponseEntity.ok(answerService.createFromRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnswerAdminResponse> updateAnswer(@PathVariable String id, @RequestBody AnswerRequest request) {
        return answerService.updateFromRequest(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnswer(@PathVariable String id) {
        return answerService.findById(id)
                .map(existing -> {
                    answerService.deleteById(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
