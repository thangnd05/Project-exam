package com.project_exam.backend.modules.admin.test.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.service.TestCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequirePermission(PermissionCatalog.TEST_MANAGE)
@RequestMapping("/api/admin/tests")
@RequiredArgsConstructor
public class TestAdminController {

    private final TestCatalogService testCatalogService;

    @GetMapping
    public List<TestAdminResponse> getAllTestsByAdmin() {
        return testCatalogService.getAllTestsByAdmin();
    }

    @GetMapping("/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestAdminResponse>> getAdminTestsByExamType(@PathVariable String examTypeId) {
        return ResponseEntity.ok(testCatalogService.getAllTestsByAdminAndExamType(examTypeId));
    }
}
