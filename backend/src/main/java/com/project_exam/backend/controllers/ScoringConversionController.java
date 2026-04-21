package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ScoringConversionRequest;
import com.project_exam.backend.dto.response.ScoringConversionResponse;
import com.project_exam.backend.services.ExamAndTest.ScoringConversionService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scoring-conversions")
@AllArgsConstructor
public class ScoringConversionController {

    private final ScoringConversionService scoringConversionService;

    @GetMapping
    public ResponseEntity<List<ScoringConversionResponse>> getAll() {
        return ResponseEntity.ok(scoringConversionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(scoringConversionService.findById(id));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ScoringConversionResponse> create(@RequestBody ScoringConversionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> update(
            @PathVariable String id,
            @RequestBody ScoringConversionRequest request) {
        try {
            return ResponseEntity.ok(scoringConversionService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            scoringConversionService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }
}
