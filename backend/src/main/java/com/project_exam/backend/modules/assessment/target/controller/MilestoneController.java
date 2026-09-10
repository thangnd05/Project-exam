package com.project_exam.backend.modules.assessment.target.controller;

import com.project_exam.backend.modules.assessment.target.dto.MilestoneRequest;
import com.project_exam.backend.modules.assessment.target.dto.MilestoneResponse;
import com.project_exam.backend.modules.assessment.target.service.MilestoneService;
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

}
