package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeLayoutResponse;
import com.project_exam.backend.modules.assessment.exam.service.ExamTypeLayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam-types")
@RequiredArgsConstructor
public class ExamTypeLayoutController {

    private final ExamTypeLayoutService layoutService;

    @GetMapping("/{examTypeId}/layout")
    public ResponseEntity<ExamTypeLayoutResponse> getLayout(@PathVariable String examTypeId) {
        ExamTypeLayoutResponse res = layoutService.getResolved(examTypeId);
        return res == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(res);
    }

    @GetMapping("/{examTypeId}/layout/own")
    public ResponseEntity<ExamTypeLayoutResponse> getOwnLayout(@PathVariable String examTypeId) {
        ExamTypeLayoutResponse res = layoutService.getOwn(examTypeId);
        return res == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(res);
    }

    @PutMapping("/{examTypeId}/layout")
    public ResponseEntity<ExamTypeLayoutResponse> upsertLayout(
            @PathVariable String examTypeId,
            @RequestBody ExamTypeLayoutRequest request
    ) {
        return ResponseEntity.ok(layoutService.upsert(examTypeId, request));
    }
}
