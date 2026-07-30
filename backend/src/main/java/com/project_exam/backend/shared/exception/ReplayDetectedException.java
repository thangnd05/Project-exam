package com.project_exam.backend.shared.exception;

import org.springframework.http.HttpStatus;

public class ReplayDetectedException extends AppException {
    public ReplayDetectedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
