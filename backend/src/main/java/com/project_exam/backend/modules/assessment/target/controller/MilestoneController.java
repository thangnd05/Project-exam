package com.project_exam.backend.modules.assessment.target.controller;

import com.project_exam.backend.modules.assessment.target.dto.MilestoneRequest;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneResponse;
import com.project_exam.backend.modules.assessment.target.service.MilestoneService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<MilestoneResponse>> getByExamType(
            @RequestParam String examTypeId
    ) {
        return ResponseEntity.ok(milestoneService.findByExamTypeId(examTypeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MilestoneResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(milestoneService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MilestoneResponse> create(
            @Valid @RequestBody MilestoneRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneResponse> update(
            @PathVariable String id,
            @Valid @RequestBody MilestoneRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(milestoneService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        milestoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
