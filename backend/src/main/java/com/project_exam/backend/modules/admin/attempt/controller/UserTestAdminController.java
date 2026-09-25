package com.project_exam.backend.modules.admin.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin/user-tests")
@RequiredArgsConstructor
public class UserTestAdminController {

    private final UserTestService userTestService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserTestResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.ATTEMPT_MANAGE);
        return ResponseEntity.ok(userTestService.findAllResponses());
    }
}
