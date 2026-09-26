package com.project_exam.backend.modules.admin.test.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.service.TestCatalogService;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/tests")
@RequiredArgsConstructor
public class TestAdminController {

    private final TestCatalogService testCatalogService;
    private final AuthUtils authUtils;

    @GetMapping
    public List<TestAdminResponse> getAllTestsByAdmin() {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        return testCatalogService.getAllTestsByAdmin();
    }

    @GetMapping("/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestAdminResponse>> getAdminTestsByExamType(@PathVariable String examTypeId) {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        List<TestAdminResponse> adminTests = testCatalogService.getAllTestsByAdmin()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .toList();
        return ResponseEntity.ok(adminTests);
    }
}
