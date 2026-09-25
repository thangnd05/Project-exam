package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionResponse;
import com.project_exam.backend.modules.assessment.exam.service.ScoringConversionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scoring-conversions")
@RequiredArgsConstructor
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

}
