package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.ResultSummaryDto;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import com.project_exam.backend.modules.assessment.attempt.service.UserAnswerService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<UserAnswerResponse>> getAll(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userAnswerService.findAllResponses(httpRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAnswerResponse> getById(@PathVariable String id, HttpServletRequest httpRequest) {
        return userAnswerService.findResponseById(id, httpRequest)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user-test/{userTestId}")
    public ResponseEntity<List<UserAnswerResponse>> getByUserTest(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userAnswerService.findResponsesByUserTestId(userTestId, httpRequest));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<UserAnswerResponse>> getByQuestion(
            @PathVariable String questionId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userAnswerService.findResponsesByQuestionId(questionId, httpRequest));
    }

    @PostMapping
    public ResponseEntity<UserAnswerResponse> create(
            @Valid @RequestBody UserAnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userAnswerService.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAnswerResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserAnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userAnswerService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        if (userAnswerService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userAnswerService.delete(id, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<List<UserAnswerResponse>> saveUserAnswers(
            @Valid @RequestBody List<UserAnswerRequest> requests,
            HttpServletRequest httpRequest
    ) {
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

    // ===== GUEST FLOW =====

    @PostMapping("/guest/batch")
    public ResponseEntity<List<UserAnswerResponse>> saveGuestAnswers(
            @Valid @RequestBody List<UserAnswerRequest> requests,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        return ResponseEntity.ok(userAnswerService.upsertBatchForGuest(requests, guestSessionId));
    }

    @GetMapping("/guest/user-test/{userTestId}")
    public ResponseEntity<List<UserAnswerResponse>> getGuestAnswers(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        return ResponseEntity.ok(userAnswerService.findResponsesByUserTestIdForGuest(userTestId, guestSessionId));
    }

    @GetMapping("/guest/user-test/{userTestId}/result")
    public ResponseEntity<ResultSummaryDto> getGuestResult(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        return ResponseEntity.ok(userAnswerService.getGuestResultSummary(userTestId, guestSessionId));
    }

}
