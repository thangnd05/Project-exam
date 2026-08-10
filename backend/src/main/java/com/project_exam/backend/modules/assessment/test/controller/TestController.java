package com.project_exam.backend.modules.assessment.test.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
import com.project_exam.backend.modules.assessment.test.dto.CanStartTestResponse;
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
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final TestQuestionAssignmentService testQuestionAssignmentService;
    private final TestAccessService testAccessService;
    private final TestCommandService testCommandService;
    private final AuthUtils authUtils;
    private final ClassAccessGuard classAccessGuard;

    @GetMapping
    public ResponseEntity<List<TestResponse>> getAllTests() {
        return ResponseEntity.ok(testService.getAllTests());
    }

    @GetMapping("/usertest/{testId}")
    public ResponseEntity<TestResponse> getUserTest(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        TestResponse response = testService.getTestFullById(testId, userId);
        if (response == null) {
            throw new NotFoundException("Không tìm thấy bài test");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{testId}/parts-summary")
    public ResponseEntity<List<com.project_exam.backend.modules.assessment.test.dto.TestPartSummaryResponse>>
            getPartsSummary(@PathVariable String testId) {
        return ResponseEntity.ok(testService.getPartsSummary(testId));
    }

    /**
     * Trả cả đáp án đúng + giải thích nên chỉ dành cho người soạn đề. Người làm bài muốn xem lại
     * đáp án thì đi qua GET /api/user-tests/{userTestId}/review-test (có kiểm tra đã nộp bài).
     */
    @GetMapping("/admintest/{testId}")
    public ResponseEntity<TestAdminResponse> getTestByIdAdmin(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        Test test = testService.getTestById(testId)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại"));
        String userId = authUtils.getUserId(httpRequest);
        boolean isOwner = userId != null && userId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xem chi tiết đề này.");
        }
        return ResponseEntity.ok(testService.getTestFullByIdAdmin(testId));
    }

    @PostMapping
    public ResponseEntity<TestResponse> createTest(
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);

        if (request.getClassId() != null) {
            classAccessGuard.requireTeacher(request.getClassId(), currentUserId);
            classAccessGuard.requireChapterInClass(request.getChapterId(), request.getClassId());
        } else if (request.getChapterId() != null) {

            throw new com.project_exam.backend.shared.exception.BadRequestException(
                    "Khi có chapterId thì phải có classId.");
        }
        Test test = new Test();
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setExamTypeId(request.getExamTypeId());
        test.setDurationMinutes(request.getDurationMinutes());
        test.setBannerUrl(request.getBannerUrl());
        test.setMaxAttempts(request.getMaxAttempts());
        test.setClassId(request.getClassId());
        test.setChapterId(request.getChapterId());
        test.setExamCategoryId(request.getExamCategoryId());
        test.setCollectionId(request.getCollectionId());
        test.setAvailableFrom(request.getAvailableFrom());
        test.setAvailableTo(request.getAvailableTo());

        if (request.getCostCoins() != null
                && authUtils.hasPermission(PermissionCatalog.TEST_MANAGE_PRICING)
                && request.getClassId() == null) {
            test.setCostCoins(request.getCostCoins());
        }
        test.setCreatedBy(currentUserId);
        test.setCreatedAt(Instant.now());
        Test savedTest = testCommandService.save(test);
        TestResponse response = testService.buildUserTestSummary(savedTest, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/parts/questions")
    public ResponseEntity<Void> addQuestionsToTestPart(
            @Valid @RequestBody AddQuestionsToTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        testQuestionAssignmentService.addQuestionsToTestPart(request, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/parts/random-questions")
    public ResponseEntity<AddRandomQuestionsResponse> addRandomQuestionsToTestPart(
            @Valid @RequestBody AddRandomQuestionsToTestRequest request,
            HttpServletRequest httpRequest
    ) {
        if ("admin".equalsIgnoreCase(request.getBank())) {
            authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        }
        String currentUserId = authUtils.getUserId(httpRequest);
        AddRandomQuestionsResponse response = testQuestionAssignmentService.addRandomQuestionsToTestPart(request, currentUserId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestResponse> updateTest(
            @PathVariable String id,
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        Test updated = testCommandService.updateTest(id, request, userId);
        return ResponseEntity.ok(testService.buildUserTestSummary(updated, updated.getCreatedBy()));
    }

    @PostMapping("/{testId}/purchase")
    public ResponseEntity<TestResponse> purchaseTestAccess(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(testAccessService.purchaseTestAccess(userId, testId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable String id, HttpServletRequest httpRequest) {
        if (testService.getTestById(id).isEmpty()) {
            throw new NotFoundException("Test không tồn tại");
        }
        String userId = authUtils.getUserId(httpRequest);
        testCommandService.deleteTest(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin")
    public List<TestAdminResponse> getAllTestsByAdmin() {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        return testService.getAllTestsByAdmin();
    }

    @GetMapping("/my")
    public List<TestResponse> getMyTests(HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        return testService.getTestsByUser(userId);
    }

    @GetMapping("/admin/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestAdminResponse>> getAdminTestsByExamType(@PathVariable String examTypeId) {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        List<TestAdminResponse> adminTests = testService.getAllTestsByAdmin()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .toList();
        return ResponseEntity.ok(adminTests);
    }

    @GetMapping("/user/by-exam-type/{examTypeId}")
    public ResponseEntity<PageResponse<TestResponse>> getTestsByExamType(
            @PathVariable String examTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest httpRequest
    ) {

        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        return ResponseEntity.ok(testService.getAdminTestsByExamTypePaged(examTypeId, page, size, userId));
    }

    @GetMapping("/collections/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestCollectionResponse>> getTestCollectionsByExamType(
            @PathVariable String examTypeId
    ) {
        return ResponseEntity.ok(testService.getTestCollectionsByExamType(examTypeId));
    }

    @GetMapping("/user/by-collection/{collectionId}")
    public ResponseEntity<PageResponse<TestResponse>> getTestsByCollection(
            @PathVariable String collectionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest httpRequest
    ) {
        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        return ResponseEntity.ok(testService.getTestsByCollectionPaged(collectionId, page, size, userId));
    }

    @GetMapping("/quick-challenge")
    public ResponseEntity<List<QuickChallengeCardResponse>> getQuickChallengeTests() {
        return ResponseEntity.ok(testService.getQuickChallengeTests());
    }

    @GetMapping("/{testId}/can-start")
    public ResponseEntity<CanStartTestResponse> canStartTest(
            @PathVariable String testId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        Test test = testService.getTestById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        if (test.getClassId() != null) {
            classAccessGuard.requireMemberOrTeacher(test.getClassId(), userId);
        }
        CanStartTestResponse result = testAccessService.canStartTest(userId, test);

        if (!result.isCanStart()) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/by-class/{classId}")
    public ResponseEntity<List<TestResponse>> getTestsByClass(
            @PathVariable String classId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        List<TestResponse> responses = testService.getTestByClassId(classId, userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-all-test")
    public ResponseEntity<List<TestResponse>> getTestsCreateBy(HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        List<TestResponse> responses = testService.getTestByCreateBy(userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-tests")
    public ResponseEntity<PageResponse<TestResponse>> getMyPersonalTests(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        String userId = authUtils.getUserId(request);
        return ResponseEntity.ok(testService.getMyPersonalTestsPaged(userId, page, size));
    }

}
