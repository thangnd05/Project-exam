package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.EvaluationRequest;
import com.project_exam.backend.dto.response.EvaluationResponse;
import com.project_exam.backend.services.EvaluationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@AllArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<EvaluationResponse> create(
            HttpServletRequest httpRequest,
            @RequestBody EvaluationRequest request
    ) {
        try {
            EvaluationResponse created = evaluationService.create(httpRequest, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<EvaluationResponse>> getAll() {
        return ResponseEntity.ok(evaluationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationResponse> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(evaluationService.getById(id));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<EvaluationResponse>> getMyEvaluations(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(evaluationService.getMyEvaluations(httpRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvaluationResponse> update(
            @PathVariable String id,
            @RequestBody EvaluationRequest request
    ) {
        try {
            return ResponseEntity.ok(evaluationService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            evaluationService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }
}
