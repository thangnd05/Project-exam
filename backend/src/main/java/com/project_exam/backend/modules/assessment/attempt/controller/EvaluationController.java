package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationStatusResponse;
import com.project_exam.backend.modules.assessment.attempt.service.EvaluationService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Phía học viên chỉ gửi đánh giá và hỏi đã đánh giá đề chưa; xem/xoá nằm ở EvaluationAdminController. */
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<EvaluationResponse> create(
            HttpServletRequest httpRequest,
            @Valid @RequestBody EvaluationRequest request
    ) {
        String userId = authUtils.getUserId(httpRequest);
        EvaluationResponse created = evaluationService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/status")
    public ResponseEntity<EvaluationStatusResponse> getStatus(
            HttpServletRequest httpRequest,
            @RequestParam String testId
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(evaluationService.getStatus(userId, testId));
    }
}
