package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestUpdateRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/user-tests")
@RequiredArgsConstructor
public class UserTestController {

    private final UserTestService userTestService;
    private final AuthUtils authUtils;

    // Cookie định danh phiên guest do SERVER đặt (HttpOnly) — nguồn tin cậy khi claim.
    // Cấu hình qua env: APP_GUEST_COOKIE_NAME / APP_GUEST_COOKIE_MAX_AGE.
    @Value("${app.guest.cookie-name}")
    private String guestCookieName;

    @Value("${app.guest.cookie-max-age}")
    private int guestCookieMaxAge;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

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

    //  Lấy theo user đang đăng nhập (JWT).
    //  status=COMPLETED (+ examTypeId tuỳ chọn) -> chỉ bài đã hoàn thành, đã sort mới→cũ ở DB.
    @GetMapping("/my")
    public ResponseEntity<List<UserTestResponse>> getByCurrentUser(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(userTestService.findCompletedResponsesByUserId(userId, examTypeId));
        }
        return ResponseEntity.ok(userTestService.findResponsesByUserId(userId));
    }

    // Lịch sử mock (phân trang): chỉ bài làm đề đầy đủ, bỏ luyện tập theo Part & Quick Challenge.
    @GetMapping("/my/mock-history")
    public ResponseEntity<PageResponse<UserTestResponse>> getMyMockHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String examTypeId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.getMockHistory(userId, examTypeId, page, size));
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
        UserTest userTest = userTestService.startUserTest(
                request.getTestId(), userId, request.getMode(), request.getExamPartIds());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Bắt đầu làm bài thành công");
        response.put("userTestId", userTest.getUserTestId());
        response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
        response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        response.put("mode", userTest.getMode() != null ? userTest.getMode().name() : "FULL_TEST");
        response.put("serverNow", java.time.Instant.now().toString());

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
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) List<String> examPartIds,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        Optional<UserTest> active = userTestService.findActiveUserTest(userId, testId, mode, examPartIds);

        Map<String, Object> response = new HashMap<>();
        // serverNow để frontend đồng bộ đồng hồ (tránh clock skew khi tính timer).
        response.put("serverNow", java.time.Instant.now().toString());
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
            @RequestHeader("X-Guest-Session") String guestSessionId,
            HttpServletResponse httpResponse
    ) {
        if (request == null || request.getTestId() == null || request.getTestId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing testId"));
        }
        UserTest userTest = userTestService.startGuestUserTest(request.getTestId(), guestSessionId);
        // Ràng buộc phiên guest vào trình duyệt này bằng cookie HttpOnly (server-set) để claim an toàn.
        setGuestSessionCookie(httpResponse, guestSessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Bắt đầu làm bài (guest) thành công");
        response.put("userTestId", userTest.getUserTestId());
        response.put("status", userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN");
        response.put("startedAt", userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null);
        response.put("serverNow", java.time.Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userTestId}/guest-submit")
    public ResponseEntity<UserTestResponse> submitGuestTest(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId,
            HttpServletResponse response
    ) {
        UserTest submitted = userTestService.submitGuestTest(userTestId, guestSessionId);
        // Đảm bảo cookie ràng buộc vẫn còn (kể cả khi cookie lúc start đã mất/hết hạn).
        setGuestSessionCookie(response, guestSessionId);
        return ResponseEntity.ok(userTestService.toResponse(submitted));
    }

    @GetMapping("/guest/check-active")
    public ResponseEntity<Map<String, Object>> checkActiveGuestUserTest(
            @RequestParam String testId,
            @RequestHeader("X-Guest-Session") String guestSessionId
    ) {
        Optional<UserTest> active = userTestService.findActiveGuestUserTest(guestSessionId, testId);

        Map<String, Object> response = new HashMap<>();
        response.put("serverNow", java.time.Instant.now().toString());
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

    // Gắn bài làm của phiên guest vào tài khoản vừa đăng nhập (yêu cầu JWT).
    // FE gọi ngay sau login/OAuth thành công. guestSessionId lấy TỪ COOKIE HttpOnly do server đặt
    // (KHÔNG tin header client tự cấp) -> chỉ trình duyệt đã làm bài guest mới claim được phiên đó.
    @PostMapping("/claim-guest")
    public ResponseEntity<Map<String, Object>> claimGuestTests(
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        String userId = authUtils.getUserId(httpRequest);
        String guestSessionId = readGuestSessionCookie(httpRequest);
        if (guestSessionId == null || guestSessionId.isBlank()) {
            return ResponseEntity.ok(Map.of("claimed", 0));
        }
        int claimed = userTestService.claimGuestTests(userId, guestSessionId);
        clearGuestSessionCookie(response); // đã claim xong -> bỏ ràng buộc
        return ResponseEntity.ok(Map.of("claimed", claimed));
    }

    // ===== Guest-session cookie helpers =====

    private boolean isSecureCookie() {
        return frontendOrigin != null && frontendOrigin.startsWith("https");
    }

    private void setGuestSessionCookie(HttpServletResponse response, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) return;
        String sameSite = isSecureCookie() ? "; SameSite=None; Secure" : "; SameSite=Lax";
        // Path=/ để cookie được gửi tới /api/user-tests/claim-guest.
        response.addHeader("Set-Cookie",
                guestCookieName + "=" + urlEncode(guestSessionId)
                        + "; HttpOnly; Path=/; Max-Age=" + guestCookieMaxAge + sameSite);
    }

    private void clearGuestSessionCookie(HttpServletResponse response) {
        String sameSite = isSecureCookie() ? "; SameSite=None; Secure" : "; SameSite=Lax";
        response.addHeader("Set-Cookie",
                guestCookieName + "=; HttpOnly; Path=/; Max-Age=0" + sameSite);
    }

    private String readGuestSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (guestCookieName.equals(c.getName())) {
                return URLDecoder.decode(c.getValue(), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private static String urlEncode(String v) {
        return java.net.URLEncoder.encode(v, StandardCharsets.UTF_8);
    }
}
