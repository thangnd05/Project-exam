package com.project_exam.backend.modules.assessment.learning.controller;

import com.project_exam.backend.modules.assessment.learning.dto.*;
import com.project_exam.backend.modules.assessment.learning.service.LearningPlanService;
import com.project_exam.backend.modules.assessment.learning.service.LearningPlanSessionService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning-plans")
@AllArgsConstructor
public class LearningPlanController {

    private final LearningPlanService learningPlanService;
    private final LearningPlanSessionService learningPlanSessionService;
    private final AuthUtils authUtils;

    @PostMapping("/generate")
    public ResponseEntity<PlanResponse> generate(
            @Valid @RequestBody GeneratePlanRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanService.generatePlan(userId, request));
    }

    @GetMapping("/{learningPlanId}")
    public ResponseEntity<PlanResponse> get(
            @PathVariable String learningPlanId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanService.getPlan(userId, learningPlanId));
    }

    @GetMapping
    public ResponseEntity<List<PlanResponse>> list(
            @RequestParam String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanService.listPlans(userId, examTypeId));
    }

    @PutMapping("/{learningPlanId}/activate")
    public ResponseEntity<PlanResponse> switchPlan(
            @PathVariable String learningPlanId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanService.switchPlan(userId, learningPlanId));
    }

    @DeleteMapping("/{learningPlanId}")
    public ResponseEntity<Void> delete(
            @PathVariable String learningPlanId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        learningPlanService.deletePlan(userId, learningPlanId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{learningPlanId}/current-session")
    public ResponseEntity<CurrentSessionResponse> currentSession(
            @PathVariable String learningPlanId,
            @RequestParam(required = false) String taskId,
            @RequestParam(required = false, defaultValue = "false") boolean includeReview,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanSessionService.getCurrentSession(
                userId, learningPlanId, taskId, includeReview));
    }

    @PostMapping("/{learningPlanId}/sessions/{sessionId}/submit")
    public ResponseEntity<SubmitSessionResponse> submitSession(
            @PathVariable String learningPlanId,
            @PathVariable String sessionId,
            @Valid @RequestBody SubmitSessionRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanSessionService.submitSession(
                userId, learningPlanId, sessionId, request));
    }

    @GetMapping("/{learningPlanId}/tasks/{taskId}/sessions")
    public ResponseEntity<List<TaskSessionHistoryDto>> taskSessionHistory(
            @PathVariable String learningPlanId,
            @PathVariable String taskId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(learningPlanSessionService
                .getTaskSessionHistory(userId, learningPlanId, taskId));
    }
}
