package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.UserAnswerRequest;
import com.project_exam.backend.dto.response.ResultSummaryDto;
import com.project_exam.backend.dto.response.UserAnswerResponse;
import com.project_exam.backend.services.ExamAndTest.UserAnswerService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-answers")
@AllArgsConstructor
public class UserAnswerController {

    private final UserAnswerService userAnswerService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserAnswerResponse>> getAll() {
        return ResponseEntity.ok(userAnswerService.findAllResponses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAnswerResponse> getById(@PathVariable String id) {
        return userAnswerService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user-test/{userTestId}")
    public ResponseEntity<List<UserAnswerResponse>> getByUserTest(@PathVariable String userTestId) {
        return ResponseEntity.ok(userAnswerService.findResponsesByUserTestId(userTestId));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<UserAnswerResponse>> getByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(userAnswerService.findResponsesByQuestionId(questionId));
    }

    @PostMapping
    public ResponseEntity<UserAnswerResponse> create(@RequestBody UserAnswerRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userAnswerService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAnswerResponse> update(
            @PathVariable String id,
            @RequestBody UserAnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userAnswerService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return userAnswerService.findById(id)
                .map(existing -> {
                    userAnswerService.delete(id);
                    return ResponseEntity.noContent().build(); // 204 No Content
                })
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    @PostMapping("/batch")
    public ResponseEntity<?> saveUserAnswers(@RequestBody List<UserAnswerRequest> requests, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        List<UserAnswerResponse> responses = userAnswerService.upsertBatch(requests, userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/user-test/{userTestId}/result")
    public ResponseEntity<ResultSummaryDto> getResult(@PathVariable String userTestId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        ResultSummaryDto result = userAnswerService.getResultSummary(userTestId, userId);
        return ResponseEntity.ok(result);
    }

}
