package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestUpdateRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.shared.util.AuthUtils;
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

    //  Lấy tất cả user test (admin only)
    @GetMapping
    public ResponseEntity<List<UserTestResponse>> getAll(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userTestService.findAllResponses(httpRequest));
    }

    //  Lấy theo ID
    @GetMapping("/{userTestId}")
    public ResponseEntity<UserTestResponse> getUserTestById(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userTestService.getMeta(userTestId, httpRequest));
    }

    //  Lấy theo user đang đăng nhập (JWT)
    @GetMapping("/my")
    public ResponseEntity<List<UserTestResponse>> getByCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.findResponsesByUserId(userId));
    }

    //  Lấy theo testId (chỉ chủ đề / admin)
    @GetMapping("/test/{testId}")
    public ResponseEntity<List<UserTestResponse>> getByTest(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userTestService.findResponsesByTestId(testId, httpRequest));
    }

    //  Tạo hoặc bắt đầu bài test mới
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
        response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        response.put("serverNow", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    //  Cập nhật UserTest
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

    //  Xóa UserTest (owner hoặc admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        if (userTestService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userTestService.delete(id, httpRequest);
        return ResponseEntity.noContent().build();
    }

    //  Nộp bài thi
    @PostMapping("/{userTestId}/submit")
    public ResponseEntity<UserTestResponse> submitTest(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        UserTest submittedTest = userTestService.submitTest(userTestId, userId);
        return ResponseEntity.ok(userTestService.toResponse(submittedTest));
    }

    //  Kiểm tra có đang làm dở không
    @GetMapping("/check-active")
    public ResponseEntity<Map<String, Object>> checkActiveUserTest(
            @RequestParam String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        Optional<UserTest> active = userTestService.findActiveUserTest(userId, testId);

        Map<String, Object> response = new HashMap<>();
        // serverNow để frontend đồng bộ đồng hồ (tránh clock skew khi tính timer).
        response.put("serverNow", java.time.LocalDateTime.now().toString());
        if (active.isPresent()) {
            UserTest userTest = active.get();
            response.put("userTestId", userTest.getUserTestId());
            response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
            response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        } else {
            response.put("userTestId", null);
            response.put("status", "NONE");
            response.put("startedAt", null);
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
    public ResponseEntity<TestLeaderboardResponse> getAttemptsTest(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        TestLeaderboardResponse res = userTestService.getAttemptsByTest(testId, httpRequest);
        return ResponseEntity.ok(res);
    }

    // ===== GUEST FLOW =====
    // Định danh phiên: client tự sinh UUID, gửi qua header X-Guest-Session.

    @PostMapping("/guest")
    public ResponseEntity<Map<String, Object>> startGuestUserTest(
            @Valid @RequestBody StartUserTestRequest request,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        if (request == null || request.getTestId() == null || request.getTestId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing testId"));
        }
        UserTest userTest = userTestService.startGuestUserTest(request.getTestId(), guestSessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Bắt đầu làm bài (guest) thành công");
        response.put("userTestId", userTest.getUserTestId());
        response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
        response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        response.put("serverNow", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userTestId}/guest-submit")
    public ResponseEntity<UserTestResponse> submitGuestTest(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        UserTest submitted = userTestService.submitGuestTest(userTestId, guestSessionId);
        return ResponseEntity.ok(userTestService.toResponse(submitted));
    }

    @GetMapping("/guest/check-active")
    public ResponseEntity<Map<String, Object>> checkActiveGuestUserTest(
            @RequestParam String testId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        Optional<UserTest> active = userTestService.findActiveGuestUserTest(guestSessionId, testId);

        Map<String, Object> response = new HashMap<>();
        response.put("serverNow", java.time.LocalDateTime.now().toString());
        if (active.isPresent()) {
            UserTest userTest = active.get();
            response.put("userTestId", userTest.getUserTestId());
            response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
            response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        } else {
            response.put("userTestId", null);
            response.put("status", "NONE");
            response.put("startedAt", null);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/guest/{userTestId}")
    public ResponseEntity<UserTestResponse> getGuestUserTest(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        return ResponseEntity.ok(userTestService.getMetaForGuest(userTestId, guestSessionId));
    }
}
