package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.AddQuestionsToTestRequest;
import com.project_exam.backend.dto.request.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.dto.response.AddRandomQuestionsResponse;
import com.project_exam.backend.dto.request.CreateTestRequest;
import com.project_exam.backend.dto.response.admin.TestAdminResponse;
import com.project_exam.backend.dto.response.user.TestResponse;
import com.project_exam.backend.models.Test;
import com.project_exam.backend.services.ExamAndTest.TestService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@AllArgsConstructor
public class TestController {

    private final TestService testService;
    private final AuthUtils authUtils;

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
        try {
            // ✅ Gọi service: userId tự lấy từ token bên trong service
            TestResponse response = testService.getTestFullById(testId, httpRequest);

            if (response == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/admintest/{testId}")
    public ResponseEntity<TestAdminResponse> getTestByIdAdmin(@PathVariable String testId) {
        TestAdminResponse response = testService.getTestFullByIdAdmin(testId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TestResponse> createTest(@RequestBody CreateTestRequest request, HttpServletRequest httpRequest) {
        try {
            // 1. Lấy userId người tạo từ token (Dùng authUtils bạn đã có)
            String currentUserId = authUtils.getUserId(httpRequest);

            // 2. Map dữ liệu từ DTO sang Model
            Test test = new Test();
            test.setTitle(request.getTitle());
            test.setDescription(request.getDescription());
            test.setExamTypeId(request.getExamTypeId());
            test.setDurationMinutes(request.getDurationMinutes());
            test.setBannerUrl(request.getBannerUrl());
            test.setMaxAttempts(request.getMaxAttempts());
            test.setClassId(request.getClassId());
            test.setChapterId(request.getChapterId());
            test.setAvailableFrom(request.getAvailableFrom());
            test.setAvailableTo(request.getAvailableTo());

            // Gán thông tin hệ thống
            test.setCreatedBy(currentUserId);
            test.setCreatedAt(LocalDateTime.now());

            // 3. Lưu vào database thông qua service
            Test savedTest = testService.save(test);
            TestResponse response = testService.buildUserTestSummary(savedTest, currentUserId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /** Gắn câu hỏi từ kho vào part của đề (chỉ tạo test_questions). Không tạo câu hỏi mới. */
    @PostMapping("/parts/questions")
    public ResponseEntity<Void> addQuestionsToTestPart(@RequestBody AddQuestionsToTestRequest request) {
        try {
            testService.addQuestionsToTestPart(request);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** Lấy câu hỏi random từ kho và gắn vào part. Cá nhân: không gửi classId/chapterId (theo user JWT). Lớp: gửi classId (+ chapterId). */
    @PostMapping("/parts/random-questions")
    public ResponseEntity<AddRandomQuestionsResponse> addRandomQuestionsToTestPart(
            @RequestBody AddRandomQuestionsToTestRequest request,
            HttpServletRequest httpRequest) {
        try {
            String currentUserId = authUtils.getUserId(httpRequest);
            AddRandomQuestionsResponse response = testService.addRandomQuestionsToTestPart(request, currentUserId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Cập nhật test (dùng chung CreateTestRequest; chỉ ghi đè field gửi lên, không đổi createdBy/createdAt)
    @PutMapping("/{id}")
    public ResponseEntity<TestResponse> updateTest(@PathVariable String id, @RequestBody CreateTestRequest request) {
        try {
            Test updated = testService.updateTest(id, request);
            return ResponseEntity.ok(testService.buildUserTestSummary(updated, updated.getCreatedBy()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    // Xoá test
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTest(@PathVariable String id) {
        return testService.getTestById(id)
                .map(existing -> {
                    testService.deleteTest(id);
                    return ResponseEntity.noContent().build(); // 204 No Content
                })
                .orElseGet(() -> ResponseEntity.notFound().build()); // 404 Not Found
    }

    @GetMapping("/admin")
    public List<TestAdminResponse> getAllTestsByAdmin() {
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
        List<TestAdminResponse> adminTests = testService.getAllTestsByAdmin()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .toList();
        return ResponseEntity.ok(adminTests);
    }

    // Lấy danh sách test theo examTypeId cho user
    @GetMapping("/user/by-exam-type/{examTypeId}")
    public ResponseEntity<List<TestResponse>> getTestsByExamType(
            @PathVariable String examTypeId
    ) {
        List<TestResponse> responses = testService.getAllTests()
                .stream()
                .filter(t -> t.getExamTypeId().equals(examTypeId))
                .filter(t -> t.getClassId() == null)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{testId}/can-start")
    public ResponseEntity<Map<String, Object>> canStartTest(
            @PathVariable String testId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        Test test = testService.getTestById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));
        Map<String, Object> result = testService.canStartTest(userId, test);

        if (!(Boolean) result.get("canStart")) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/by-class/{classId}")
    public ResponseEntity<?> getTestsByClass(
            @PathVariable String classId,
            HttpServletRequest request
    ) {
        List<TestResponse> responses = testService.getTestByClassId(classId, request);

        if (responses.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Không có bài test nào trong lớp này"));
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-all-test")
    public ResponseEntity<?> getTestsCreateBy(HttpServletRequest request) {
        List<TestResponse> responses = testService.getTestByCreateBy(request);

        if (responses.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Không có bài test nào trong lớp này"));
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my-tests")
    public ResponseEntity<List<TestResponse>> getMyPersonalTests(
            HttpServletRequest request
    ) {
        List<TestResponse> responses =
                testService.getMyPersonalTests(request);

        return ResponseEntity.ok(responses);
    }

}
