package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 *  SECURITY: Tất cả endpoint ở đây trả về flag <code>isCorrect</code>.
 * Để tránh student cheat bằng cách query đáp án đúng, mọi endpoint đều yêu cầu admin.
 * Edit answer trong flow tạo/sửa câu hỏi đi qua {@code QuestionService.updateQuestion}
 * (đã có ownership check) service nội bộ gọi {@code AnswerService.syncAnswers} không qua HTTP.
 */
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
        return ResponseEntity.ok(answerService.createFromRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnswerAdminResponse> updateAnswer(
            @PathVariable String id,
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_MANAGE);
        return answerService.updateFromRequest(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnswer(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.ANSWER_MANAGE);
        if (answerService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        answerService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
