package com.project_exam.backend.modules.auth.controller;

import com.project_exam.backend.modules.auth.dto.ChangePasswordRequest;
import com.project_exam.backend.modules.auth.dto.ForgotPasswordRequest;
import com.project_exam.backend.modules.auth.dto.LoginRequest;
import com.project_exam.backend.modules.auth.dto.RegisterRequest;
import com.project_exam.backend.modules.auth.dto.ResetPasswordRequest;
import com.project_exam.backend.modules.auth.dto.AuthMessageResponse;
import com.project_exam.backend.modules.users.dto.UserResponse;
import com.project_exam.backend.modules.auth.service.AuthService;
import com.project_exam.backend.modules.users.service.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest,
                                              HttpServletResponse response) {
        UserResponse userResponse = authService.login(request.getIdentifier(), request.getPassword(), response);
        httpRequest.setAttribute("AUDIT_USER_ID", userResponse.getId());
        return ResponseEntity.ok(userResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthMessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                              HttpServletRequest httpRequest,
                                                              HttpServletResponse httpResponse) {
        return ResponseEntity.ok(authService.changePassword(request, httpRequest, httpResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        return ResponseEntity.ok(authService.me(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(@RequestBody Map<String, String> body, HttpServletResponse response) {
        String refreshToken = body.get("refreshToken");
        return ResponseEntity.ok(authService.refresh(refreshToken, response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(Map.of("message", "Đã logout"));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        return emailVerificationService.verifyToken(token);
    }

}
