package com.project_exam.backend.modules.assessment.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.ClaimGuestTestsResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestUpdateRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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

    @Value("${app.guest.cookie-name}")
    private String guestCookieName;

    @Value("${app.guest.cookie-max-age}")
    private int guestCookieMaxAge;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    @GetMapping
    public ResponseEntity<List<UserTestResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.ATTEMPT_MANAGE);
        return ResponseEntity.ok(userTestService.findAllResponses());
    }

    @GetMapping("/{userTestId}")
    public ResponseEntity<UserTestResponse> getUserTestById(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.getMeta(userTestId, userId));
    }

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

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<UserTestResponse>> getByTest(
            @PathVariable String testId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.findResponsesByTestId(testId, userId));
    }

    @PostMapping
    public ResponseEntity<StartUserTestResponse> startUserTest(
            @Valid @RequestBody StartUserTestRequest request,
            HttpServletRequest httpRequest
    ) {
        if (request.getTestId() == null || request.getTestId().isBlank()) {
            throw new BadRequestException("testId không được để trống");
        }

        String userId = authUtils.getUserId(httpRequest);
        UserTest userTest = userTestService.startUserTest(
                request.getTestId(), userId, request.getMode(), request.getExamPartIds());

        StartUserTestResponse response = StartUserTestResponse.builder()
                .message("Bắt đầu làm bài thành công")
                .userTestId(userTest.getUserTestId())
                .status(userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN")
                .startedAt(userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null)
                .mode(userTest.getMode() != null ? userTest.getMode().name() : "FULL_TEST")
                .serverNow(java.time.Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserTestResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserTestUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        if (request.getStatus() == null) {
            throw new BadRequestException("status không được để trống");
        }
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userTestService.updateStatusByOwner(id, userId, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        if (userTestService.findById(id).isEmpty()) {
            throw new NotFoundException("User test không tồn tại");
        }
        String userId = authUtils.getUserId(httpRequest);
        userTestService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userTestId}/submit")
    public ResponseEntity<UserTestResponse> submitTest(
            @PathVariable String userTestId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        UserTest submittedTest = userTestService.submitTest(userTestId, userId);
        return ResponseEntity.ok(userTestService.toResponse(submittedTest));
    }

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
        String userId = authUtils.getUserId(httpRequest);
        TestLeaderboardResponse res = userTestService.getAttemptsByTest(testId, userId);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/guest")
    public ResponseEntity<StartUserTestResponse> startGuestUserTest(
            @Valid @RequestBody StartUserTestRequest request,
            @RequestHeader("X-Guest-Session") String guestSessionId,
            HttpServletResponse httpResponse
    ) {
        if (request.getTestId() == null || request.getTestId().isBlank()) {
            throw new BadRequestException("testId không được để trống");
        }
        UserTest userTest = userTestService.startGuestUserTest(request.getTestId(), guestSessionId);

        setGuestSessionCookie(httpResponse, guestSessionId);

        StartUserTestResponse response = StartUserTestResponse.builder()
                .message("Bắt đầu làm bài (guest) thành công")
                .userTestId(userTest.getUserTestId())
                .status(userTest.getStatus() != null ? userTest.getStatus().name() : "UNKNOWN")
                .startedAt(userTest.getStartedAt() != null ? userTest.getStartedAt().toString() : null)
                .mode(userTest.getMode() != null ? userTest.getMode().name() : "FULL_TEST")
                .serverNow(java.time.Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{userTestId}/guest-submit")
    public ResponseEntity<UserTestResponse> submitGuestTest(
            @PathVariable String userTestId,
            @RequestHeader("X-Guest-Session") String guestSessionId,
            HttpServletResponse response
    ) {
        UserTest submitted = userTestService.submitGuestTest(userTestId, guestSessionId);

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

    @PostMapping("/claim-guest")
    public ResponseEntity<ClaimGuestTestsResponse> claimGuestTests(
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        String userId = authUtils.getUserId(httpRequest);
        String guestSessionId = readGuestSessionCookie(httpRequest);
        if (guestSessionId == null || guestSessionId.isBlank()) {
            return ResponseEntity.ok(ClaimGuestTestsResponse.builder().claimed(0).build());
        }
        int claimed = userTestService.claimGuestTests(userId, guestSessionId);
        clearGuestSessionCookie(response);
        return ResponseEntity.ok(ClaimGuestTestsResponse.builder().claimed(claimed).build());
    }

    private boolean isSecureCookie() {
        return frontendOrigin != null && frontendOrigin.startsWith("https");
    }

    private void setGuestSessionCookie(HttpServletResponse response, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) return;
        String sameSite = isSecureCookie() ? "; SameSite=None; Secure" : "; SameSite=Lax";

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
