package com.project_exam.backend.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Phát hiện refresh token bị dùng lại (replay).
 * Why: theo OAuth2 Security BCP — khi 1 refresh token đã rotate mà jti cũ bị submit lại,
 * coi như session bị xâm phạm → revoke cả family, ép login lại.
 */
public class ReplayDetectedException extends AppException {
    public ReplayDetectedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
