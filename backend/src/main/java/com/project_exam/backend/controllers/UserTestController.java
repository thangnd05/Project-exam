package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.StartUserTestRequest;
import com.project_exam.backend.dto.request.UserTestUpdateRequest;
import com.project_exam.backend.dto.response.UserTestResponse;
import com.project_exam.backend.models.UserTest;
import com.project_exam.backend.services.ExamAndTest.UserTestService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/user-tests")
@AllArgsConstructor
public class UserTestController {

    private final UserTestService userTestService;
    private final AuthUtils authUtils;

    // ✅ Lấy tất cả user test
    @GetMapping
    public ResponseEntity<List<UserTestResponse>> getAll() {
        return ResponseEntity.ok(userTestService.findAllResponses());
    }

    // ✅ Lấy theo ID
    @GetMapping("/{userTestId}")
    public ResponseEntity<UserTestResponse> getUserTestById(@PathVariable String userTestId) {
        return ResponseEntity.ok(userTestService.getMeta(userTestId));
    }

    // ✅ Lấy theo user đang đăng nhập (JWT)
    @GetMapping("/my")
    public ResponseEntity<List<UserTestResponse>> getByCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.findResponsesByUserId(userId));
    }

    // ✅ Lấy theo testId
    @GetMapping("/test/{testId}")
    public ResponseEntity<List<UserTestResponse>> getByTest(@PathVariable String testId) {
        return ResponseEntity.ok(userTestService.findResponsesByTestId(testId));
    }

    // ✅ Tạo hoặc bắt đầu bài test mới
    @PostMapping
    public ResponseEntity<Map<String, Object>> startUserTest(
            @Valid @RequestBody StartUserTestRequest request,
            HttpServletRequest httpRequest
    ) {
        if (request == null || request.getTestId() == null || request.getTestId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing testId"));
        }

        String userId = authUtils.getUserId(httpRequest);
        UserTest userTest = userTestService.startUserTest(request.getTestId(), userId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Bắt đầu làm bài thành công");
        response.put("userTestId", userTest.getUserTestId());
        response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");

        return ResponseEntity.ok(response);
    }

    // ✅ Cập nhật UserTest
    @PutMapping("/{id}")
    public ResponseEntity<UserTestResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserTestUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        if (request == null || request.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.updateStatusByOwner(id, userId, request.getStatus()));
    }

    // ✅ Xóa UserTest
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (userTestService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userTestService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Nộp bài thi
    @PostMapping("/{userTestId}/submit")
    public ResponseEntity<UserTestResponse> submitTest(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        UserTest submittedTest = userTestService.submitTest(userTestId, userId);
        return ResponseEntity.ok(userTestService.toResponse(submittedTest));
    }

    // ✅ Kiểm tra có đang làm dở không
    @GetMapping("/check-active")
    public ResponseEntity<Map<String, Object>> checkActiveUserTest(
            @RequestParam String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        Optional<UserTest> active = userTestService.findActiveUserTest(userId, testId);

        Map<String, Object> response = new HashMap<>();
        if (active.isPresent()) {
            UserTest userTest = active.get();
            response.put("userTestId", userTest.getUserTestId());
            response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
        } else {
            response.put("userTestId", null);
            response.put("status", "NONE");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my/by-test/{testId}")
    public ResponseEntity<List<UserTestResponse>> getAttempts(
            @PathVariable String testId,
            HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);

        List<UserTestResponse> res = userTestService.getAttemptsByUserAndTest(userId, testId);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/by-test/{testId}")
    public ResponseEntity<List<UserTestResponse>> getAttemptsTest(
            @PathVariable String testId) {

        List<UserTestResponse> res = userTestService.getAttemptsByTest(testId);
        return ResponseEntity.ok(res);
    }
}
