package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.service.EvaluationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<EvaluationResponse> create(
            HttpServletRequest httpRequest,
            @Valid @RequestBody EvaluationRequest request
    ) {
        EvaluationResponse created = evaluationService.create(httpRequest, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<EvaluationResponse>> getAll() {
        return ResponseEntity.ok(evaluationService.getAll());
    }

    @GetMapping("/paged")
    public ResponseEntity<PageResponse<EvaluationResponse>> getAllPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating
    ) {
        return ResponseEntity.ok(evaluationService.getAllPaged(page, size, keyword, rating));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(evaluationService.getById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<List<EvaluationResponse>> getMyEvaluations(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(evaluationService.getMyEvaluations(httpRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvaluationResponse> update(
            @PathVariable String id,
            @Valid @RequestBody EvaluationRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(evaluationService.update(id, request, httpRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        evaluationService.delete(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
