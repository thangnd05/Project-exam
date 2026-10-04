package com.project_exam.backend.modules.assessment.test.controller;
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
import com.project_exam.backend.modules.assessment.test.service.ClassTestQueryService;
import com.project_exam.backend.modules.assessment.test.service.PersonalTestQueryService;
import com.project_exam.backend.modules.assessment.test.service.TestCatalogService;
import com.project_exam.backend.modules.assessment.test.service.TestPaperQueryService;
import com.project_exam.backend.modules.assessment.test.service.TestSummaryAssembler;
import com.project_exam.backend.modules.assessment.test.service.TestQuestionAssignmentService;
import com.project_exam.backend.modules.assessment.test.service.TestAccessService;
import com.project_exam.backend.modules.assessment.test.service.TestCommandService;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionJsonImportRequest;
import com.project_exam.backend.modules.assessment.exam.service.QuestionJsonImportService;
import com.project_exam.backend.modules.assessment.test.dto.TestJsonImportPreviewResponse;
import com.project_exam.backend.modules.assessment.test.service.TestJsonImportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestCatalogService testCatalogService;
    private final TestPaperQueryService testPaperQueryService;
    private final ClassTestQueryService classTestQueryService;
    private final PersonalTestQueryService personalTestQueryService;
    private final TestSummaryAssembler testSummaryAssembler;
    private final TestQuestionAssignmentService testQuestionAssignmentService;
    private final TestAccessService testAccessService;
    private final TestCommandService testCommandService;
    private final AuthUtils authUtils;
    private final ClassAccessGuard classAccessGuard;
    private final TestJsonImportService testJsonImportService;
    private final QuestionJsonImportService questionJsonImportService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<TestResponse>> getAllTests() {
        return ResponseEntity.ok(testCatalogService.getAllTests());
    }

    @GetMapping("/usertest/{testId}")
    public ResponseEntity<TestResponse> getUserTest(
            @PathVariable String testId,
            @RequestParam(required = false) String userTestId,
            @RequestHeader(value = "X-Guest-Session", required = false) String guestSessionId,
            HttpServletRequest httpRequest
    ) {
        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        TestResponse response = testPaperQueryService.getTestFullById(testId, userId, userTestId, guestSessionId);
        if (response == null) {
            throw new NotFoundException("Không tìm thấy bài test");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{testId}/parts-summary")
    public ResponseEntity<List<com.project_exam.backend.modules.assessment.test.dto.TestPartSummaryResponse>>
            getPartsSummary(@PathVariable String testId) {
        return ResponseEntity.ok(testPaperQueryService.getPartsSummary(testId));
    }

    @GetMapping("/admintest/{testId}")
    public ResponseEntity<TestAdminResponse> getTestByIdAdmin(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        Test test = testPaperQueryService.getTestById(testId)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại"));
        String userId = authUtils.getUserId(httpRequest);
        boolean isOwner = userId != null && userId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xem chi tiết đề này.");
        }
        return ResponseEntity.ok(testPaperQueryService.getTestFullByIdAdmin(testId));
    }

    @PostMapping
    public ResponseEntity<TestResponse> createTest(
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);
        Test savedTest = testCommandService.createTest(request, currentUserId);
        TestResponse response = testSummaryAssembler.buildUserTestSummary(savedTest, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/import/json/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestJsonImportPreviewResponse> previewImportJson(
            @RequestPart("file") MultipartFile file,
            @RequestParam String examTypeId
    ) throws IOException {
        QuestionJsonImportRequest payload = questionJsonImportService.parse(file);
        return ResponseEntity.ok(testJsonImportService.preview(payload, examTypeId));
    }

    /**
     * Tạo trọn một đề từ file JSON: câu hỏi được chia vào các phần thi theo `examPart`
     * hoặc tiền tố tag "Phần thi > Tag", mỗi phần thi thành một test part.
     */
    @PostMapping(value = "/import/json", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestResponse> importJson(
            @RequestPart("file") MultipartFile file,
            @RequestPart("request") String requestJson,
            @RequestParam(required = false) Question.UsageScope usageScope,
            HttpServletRequest httpRequest
    ) throws IOException {
        CreateTestRequest request = objectMapper.readValue(requestJson, CreateTestRequest.class);
        QuestionJsonImportRequest payload = questionJsonImportService.parse(file);
        String currentUserId = authUtils.getUserId(httpRequest);
        Test savedTest = testJsonImportService.importTest(request, payload, usageScope, currentUserId);
        TestResponse response = testSummaryAssembler.buildUserTestSummary(savedTest, currentUserId);
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

    /** Xáo một lần thứ tự câu của đề (lưu vào display_order), câu cùng đoạn văn giữ liền nhau. */
    @PostMapping("/{testId}/shuffle-questions")
    public ResponseEntity<Void> shuffleQuestionOrder(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        testQuestionAssignmentService.shuffleTestQuestionOrder(testId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestResponse> updateTest(
            @PathVariable String id,
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        Test updated = testCommandService.updateTest(id, request, userId);
        return ResponseEntity.ok(testSummaryAssembler.buildUserTestSummary(updated, updated.getCreatedBy()));
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
        if (testPaperQueryService.getTestById(id).isEmpty()) {
            throw new NotFoundException("Test không tồn tại");
        }
        String userId = authUtils.getUserId(httpRequest);
        testCommandService.deleteTest(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public List<TestResponse> getMyTests(HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        return personalTestQueryService.getTestsByUser(userId);
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
        return ResponseEntity.ok(testCatalogService.getAdminTestsByExamTypePaged(examTypeId, page, size, userId));
    }

    @GetMapping("/certificate-exams/by-exam-type/{examTypeId}")
    public ResponseEntity<CertificateExamListResponse> getCertificateExamsByExamType(
            @PathVariable String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        return ResponseEntity.ok(testCatalogService.getCertificateExamsByExamType(examTypeId, userId));
    }

    @GetMapping("/collections/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestCollectionResponse>> getTestCollectionsByExamType(
            @PathVariable String examTypeId
    ) {
        return ResponseEntity.ok(testCatalogService.getTestCollectionsByExamType(examTypeId));
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
        return ResponseEntity.ok(testCatalogService.getTestsByCollectionPaged(collectionId, page, size, userId));
    }

    @GetMapping("/quick-challenge")
    public ResponseEntity<List<QuickChallengeCardResponse>> getQuickChallengeTests() {
        return ResponseEntity.ok(testCatalogService.getQuickChallengeTests());
    }

    @GetMapping("/{testId}/can-start")
    public ResponseEntity<CanStartTestResponse> canStartTest(
            @PathVariable String testId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        Test test = testPaperQueryService.getTestById(testId)
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
        List<TestResponse> responses = classTestQueryService.getTestByClassId(classId, userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-all-test")
    public ResponseEntity<List<TestResponse>> getTestsCreateBy(HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        List<TestResponse> responses = personalTestQueryService.getTestByCreateBy(userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-tests")
    public ResponseEntity<PageResponse<TestResponse>> getMyPersonalTests(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        String userId = authUtils.getUserId(request);
        return ResponseEntity.ok(personalTestQueryService.getMyPersonalTestsPaged(userId, page, size));
    }

}
