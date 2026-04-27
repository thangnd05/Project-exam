package com.project_exam.backend.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(HttpStatus.UNAUTHORIZED, message, cause);
    }

}
