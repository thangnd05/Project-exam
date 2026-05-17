package com.project_exam.backend.modules.assessment.target.controller;

import com.project_exam.backend.modules.assessment.target.dto.UserTargetRequest;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetResponse;
import com.project_exam.backend.modules.assessment.target.service.UserTargetService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-targets")
@AllArgsConstructor
public class UserTargetController {

    private final UserTargetService userTargetService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<UserTargetResponse> get(
            @RequestParam String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTargetService.getByUserAndExamType(userId, examTypeId));
    }

    @PostMapping
    public ResponseEntity<UserTargetResponse> createOrUpdate(
            @Valid @RequestBody UserTargetRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTargetService.createOrUpdate(userId, request));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
            @RequestParam String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        userTargetService.delete(userId, examTypeId);
        return ResponseEntity.noContent().build();
    }
}
