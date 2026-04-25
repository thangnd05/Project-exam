package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ScoringConversionRequest;
import com.project_exam.backend.dto.response.ScoringConversionResponse;
import com.project_exam.backend.services.ExamAndTest.ScoringConversionService;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<ScoringConversionResponse>> getAll(
            @RequestParam(required = false) String examTypeId,
            @RequestParam(required = false) String skillId
    ) {
        return ResponseEntity.ok(scoringConversionService.findByFilters(examTypeId, skillId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(scoringConversionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScoringConversionResponse> create(@Valid @RequestBody ScoringConversionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scoringConversionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoringConversionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ScoringConversionRequest request) {
        return ResponseEntity.ok(scoringConversionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        scoringConversionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
