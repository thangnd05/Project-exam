package com.project_exam.backend.modules.assessment.test.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
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
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final TestQuestionAssignmentService testQuestionAssignmentService;
    private final TestAccessService testAccessService;
    private final AuthUtils authUtils;
    private final ClassAccessGuard classAccessGuard;

    // Lấy tất cả tests
    @GetMapping
    public ResponseEntity<List<TestResponse>> getAllTests() {
        return ResponseEntity.ok(testService.getAllTests()); // 200 OK
    }

    @GetMapping("/usertest/{testId}")
    public ResponseEntity<TestResponse> getUserTest(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        TestResponse response = testService.getTestFullById(testId, httpRequest);
        if (response == null) {
            throw new NotFoundException("Không tìm thấy bài test");
        }
        return ResponseEntity.ok(response);
    }

    /** Tóm tắt các Part (tên + số câu) để dựng modal chọn chế độ luyện tập. */
    @GetMapping("/{testId}/parts-summary")
    public ResponseEntity<List<com.project_exam.backend.modules.assessment.test.dto.TestPartSummaryResponse>>
            getPartsSummary(@PathVariable String testId) {
        return ResponseEntity.ok(testService.getPartsSummary(testId));
    }

    @GetMapping("/admintest/{testId}")
    public ResponseEntity<TestAdminResponse> getTestByIdAdmin(@PathVariable String testId) {
        TestAdminResponse response = testService.getTestFullByIdAdmin(testId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TestResponse> createTest(
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);
        // 🔒 Khi đề được gắn vào lớp: user phải là teacher của lớp đó (admin pass).
        if (request.getClassId() != null) {
            classAccessGuard.requireTeacher(request.getClassId(), currentUserId, httpRequest);
            classAccessGuard.requireChapterInClass(request.getChapterId(), request.getClassId());
        } else if (request.getChapterId() != null) {
            // Có chapterId mà không có classId là không hợp lệ.
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
        // Giá xu: chỉ admin set được, và chỉ cho bài công khai (không gắn lớp).
        if (request.getCostCoins() != null
                && authUtils.hasPermission(PermissionCatalog.TEST_MANAGE_PRICING)
                && request.getClassId() == null) {
            test.setCostCoins(request.getCostCoins());
        }
        test.setCreatedBy(currentUserId);
        test.setCreatedAt(LocalDateTime.now());
        Test savedTest = testService.save(test);
        TestResponse response = testService.buildUserTestSummary(savedTest, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Gắn câu hỏi từ kho vào part của đề (chỉ tạo test_questions). Không tạo câu hỏi mới. */
    @PostMapping("/parts/questions")
    public ResponseEntity<Void> addQuestionsToTestPart(
            @Valid @RequestBody AddQuestionsToTestRequest request,
            HttpServletRequest httpRequest
    ) {
        testQuestionAssignmentService.addQuestionsToTestPart(request, httpRequest);
        return ResponseEntity.noContent().build();
    }

    /** Lấy câu hỏi random từ kho và gắn vào part. Cá nhân: không gửi classId/chapterId (theo user JWT). Lớp: gửi classId (+ chapterId). */
    @PostMapping("/parts/random-questions")
    public ResponseEntity<AddRandomQuestionsResponse> addRandomQuestionsToTestPart(
            @Valid @RequestBody AddRandomQuestionsToTestRequest request,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);
        AddRandomQuestionsResponse response = testQuestionAssignmentService.addRandomQuestionsToTestPart(request, currentUserId, httpRequest);
        return ResponseEntity.ok(response);
    }

    // Cập nhật test (dùng chung CreateTestRequest; chỉ ghi đè field gửi lên, không đổi createdBy/createdAt)
    @PutMapping("/{id}")
    public ResponseEntity<TestResponse> updateTest(
            @PathVariable String id,
            @Valid @RequestBody CreateTestRequest request,
            HttpServletRequest httpRequest
    ) {
        Test updated = testService.updateTest(id, request, httpRequest);
        return ResponseEntity.ok(testService.buildUserTestSummary(updated, updated.getCreatedBy()));
    }

    // Mua quyền làm bài trả phí bằng xu (mua 1 lần, mở khoá vĩnh viễn)
    @PostMapping("/{testId}/purchase")
    public ResponseEntity<TestResponse> purchaseTestAccess(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(testAccessService.purchaseTestAccess(userId, testId));
    }

    // Xoá test
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable String id, HttpServletRequest httpRequest) {
        if (testService.getTestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        testService.deleteTest(id, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin")
    public List<TestAdminResponse> getAllTestsByAdmin() {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        return testService.getAllTestsByAdmin();
    }

    // Lấy test theo user đang đăng nhập (JWT)
    @GetMapping("/my")
    public List<TestResponse> getMyTests(HttpServletRequest request) {
        return testService.getTestsByUser(request);
    }

    // Lấy tất cả tests của Admin theo examTypeId
    /*
    Giải thích từng bước:

Bước 1: testService.getAllTestsByAdmin() - Lấy tất cả test từ service (dành cho admin)
Bước 2: .stream() - Chuyển danh sách thành stream để xử lý functional
Bước 3: .filter(t -> t.getExamTypeId().equals(examTypeId)) - Lọc chỉ giữ lại các Test có examTypeId khớp với tham số
Bước 4: .toList() - Chuyển stream kết quả thành List
     */
    @GetMapping("/admin/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestAdminResponse>> getAdminTestsByExamType(@PathVariable String examTypeId) {
        authUtils.requirePermission(PermissionCatalog.TEST_MANAGE);
        List<TestAdminResponse> adminTests = testService.getAllTestsByAdmin()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .toList();
        return ResponseEntity.ok(adminTests);
    }

    // Lấy danh sách test theo examTypeId cho user (chỉ trả về đề do admin tạo,
    // không lộ đề cá nhân của user khác ra danh sách chung). Có phân trang.
    @GetMapping("/user/by-exam-type/{examTypeId}")
    public ResponseEntity<PageResponse<TestResponse>> getTestsByExamType(
            @PathVariable String examTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest httpRequest
    ) {
        // Guest -> userId null (không lỗi); user đăng nhập -> biết bài đã mở khoá.
        String userId;
        try {
            userId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            userId = null;
        }
        return ResponseEntity.ok(testService.getAdminTestsByExamTypePaged(examTypeId, page, size, userId));
    }

    // Danh sách folder bộ đề (collection cha) của 1 loại kỳ thi, kèm số đề bên trong.
    @GetMapping("/collections/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestCollectionResponse>> getTestCollectionsByExamType(
            @PathVariable String examTypeId
    ) {
        return ResponseEntity.ok(testService.getTestCollectionsByExamType(examTypeId));
    }

    // Danh sách đề thuộc 1 bộ đề (gộp cả collection con), có phân trang.
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

    // Danh sách bài Quick Challenge cho Hero landing page (public, guest xem được)
    @GetMapping("/quick-challenge")
    public ResponseEntity<List<QuickChallengeCardResponse>> getQuickChallengeTests() {
        return ResponseEntity.ok(testService.getQuickChallengeTests());
    }

    @GetMapping("/{testId}/can-start")
    public ResponseEntity<Map<String, Object>> canStartTest(
            @PathVariable String testId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        Test test = testService.getTestById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        // 🔒 Nếu đề thuộc 1 lớp, user phải là member/teacher của lớp đó (admin pass).
        // Tránh leak metadata + countdown của bài kiểm tra cho user ngoài lớp.
        if (test.getClassId() != null) {
            classAccessGuard.requireMemberOrTeacher(test.getClassId(), userId, request);
        }
        Map<String, Object> result = testAccessService.canStartTest(userId, test);

        if (!(Boolean) result.get("canStart")) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/by-class/{classId}")
    public ResponseEntity<List<TestResponse>> getTestsByClass(
            @PathVariable String classId,
            HttpServletRequest request
    ) {
        List<TestResponse> responses = testService.getTestByClassId(classId, request);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-all-test")
    public ResponseEntity<List<TestResponse>> getTestsCreateBy(HttpServletRequest request) {
        List<TestResponse> responses = testService.getTestByCreateBy(request);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-tests")
    public ResponseEntity<PageResponse<TestResponse>> getMyPersonalTests(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(testService.getMyPersonalTestsPaged(request, page, size));
    }

}
