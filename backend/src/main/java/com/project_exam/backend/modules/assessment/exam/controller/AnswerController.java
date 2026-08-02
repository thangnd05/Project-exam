package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
public class AnswerController {
    private final AnswerService answerService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<AnswerAdminResponse>> getAllAnswer(HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_VIEW);
        return ResponseEntity.ok(answerService.findAllResponses());
    }

    @GetMapping("/by-question/{questionId}")
    public ResponseEntity<List<AnswerAdminResponse>> getAnswersByQuestion(
            @PathVariable String questionId,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_VIEW);
        return ResponseEntity.ok(answerService.findResponsesByQuestionId(questionId));
    }

    @PostMapping
    public ResponseEntity<AnswerAdminResponse> createAnswer(
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(answerService.createFromRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnswerAdminResponse> updateAnswer(
            @PathVariable String id,
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_MANAGE);
        AnswerAdminResponse response = answerService.updateFromRequest(id, request)
                .orElseThrow(() -> new NotFoundException("Answer không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnswer(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_MANAGE);
        if (answerService.findById(id).isEmpty()) {
            throw new NotFoundException("Answer không tồn tại");
        }
        answerService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
