package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.response.UserTestResponse;
import com.project_exam.backend.models.UserTest;
import com.project_exam.backend.services.ExamAndTest.UserTestService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/user-tests")
@AllArgsConstructor
public class UserTestController {

    private final UserTestService userTestService;
    private final AuthUtils authUtils;

    // ✅ Lấy tất cả user test
    @GetMapping
    public ResponseEntity<List<UserTest>> getAll() {
        return ResponseEntity.ok(userTestService.findAll());
    }

    // ✅ Lấy theo ID
    @GetMapping("/{userTestId}")
    public ResponseEntity<UserTestResponse> getUserTestById(@PathVariable String userTestId) {
        try {
            return ResponseEntity.ok(userTestService.getMeta(userTestId));
        } catch (ResponseStatusException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Lấy theo user đang đăng nhập (JWT)
    @GetMapping("/my")
    public ResponseEntity<List<UserTest>> getByCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.findByUserId(userId));
    }

    // ✅ Lấy theo testId
    @GetMapping("/test/{testId}")
    public ResponseEntity<List<UserTest>> getByTest(@PathVariable String testId) {
        return ResponseEntity.ok(userTestService.findByTestId(testId));
    }

    // ✅ Tạo hoặc bắt đầu bài test mới
    @PostMapping
    public ResponseEntity<?> startUserTest(@RequestBody Map<String, String> request,
                                           HttpServletRequest httpRequest) {
        try {
            String testId = request.get("testId");

            if (testId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing testId"));
            }

            // ✅ Lấy userId từ JWT token
            String userId = authUtils.getUserId(httpRequest);;
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            // ✅ Tạo hoặc tái sử dụng UserTest
            UserTest userTest = userTestService.startUserTest(testId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bắt đầu làm bài thành công");
            response.put("userTestId", userTest.getUserTestId());
            response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Cập nhật UserTest
    @PutMapping("/{id}")
    public ResponseEntity<UserTest> update(@PathVariable String id, @RequestBody UserTest userTest) {
        userTest.setUserTestId(id);
        return ResponseEntity.ok(userTestService.save(userTest));
    }

    // ✅ Xóa UserTest
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return userTestService.findById(id)
                .map(existing -> {
                    userTestService.delete(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Nộp bài thi
    @PostMapping("/{userTestId}/submit")
    public ResponseEntity<UserTest> submitTest(@PathVariable String userTestId) {
        try {
            UserTest submittedTest = userTestService.submitTest(userTestId);
            return ResponseEntity.ok(submittedTest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ Kiểm tra có đang làm dở không
    @GetMapping("/check-active")
    public ResponseEntity<?> checkActiveUserTest(
            @RequestParam String testId,
            HttpServletRequest httpRequest
    ) {
        try {
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

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
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
