package com.project_exam.backend.modules.admin.test.controller;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
import com.project_exam.backend.modules.assessment.test.dto.CanStartTestResponse;
import com.project_exam.backend.modules.assessment.test.dto.CertificateExamListResponse;
import com.project_exam.backend.modules.assessment.test.dto.CreateTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.QuickChallengeCardResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestCollectionResponse;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.service.TestService;
import com.project_exam.backend.modules.assessment.test.service.TestQuestionAssignmentService;
import com.project_exam.backend.modules.assessment.test.service.TestAccessService;
import com.project_exam.backend.modules.assessment.test.service.TestCommandService;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/tests")
@RequiredArgsConstructor
public class TestAdminController {

    private final TestService testService;
    private final AuthUtils authUtils;

    @GetMapping
    public List<TestAdminResponse> getAllTestsByAdmin() {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        return testService.getAllTestsByAdmin();
    }

    @GetMapping("/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestAdminResponse>> getAdminTestsByExamType(@PathVariable String examTypeId) {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        List<TestAdminResponse> adminTests = testService.getAllTestsByAdmin()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .toList();
        return ResponseEntity.ok(adminTests);
    }
}
