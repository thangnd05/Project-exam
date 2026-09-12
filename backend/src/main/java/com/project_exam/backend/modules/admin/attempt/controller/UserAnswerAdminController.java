package com.project_exam.backend.modules.admin.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.ResultSummaryResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EnhancedResultResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import com.project_exam.backend.modules.assessment.attempt.service.UserAnswerService;
import com.project_exam.backend.modules.assessment.attempt.service.EnhancedResultService;
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
@RequestMapping("/api/admin/user-answers")
@RequiredArgsConstructor
public class UserAnswerAdminController {

    private final UserAnswerService userAnswerService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserAnswerResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.ATTEMPT_MANAGE);
        return ResponseEntity.ok(userAnswerService.findAllResponses());
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<UserAnswerResponse>> getByQuestion(
            @PathVariable String questionId
    ) {
        authUtils.requirePermission(PermissionCatalog.ATTEMPT_MANAGE);
        return ResponseEntity.ok(userAnswerService.findResponsesByQuestionId(questionId));
    }
}
