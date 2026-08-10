package com.project_exam.backend.modules.audit.service;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

public final class AuditContext {

    public static final String ATTRIBUTE = "AUDIT_DETAILS";

    private static final int MAX_LENGTH = 2000;

    private AuditContext() {
    }

    public static void describe(String details) {
        if (details == null || details.isBlank()) return;
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes == null) return;

        String trimmed = details.length() > MAX_LENGTH ? details.substring(0, MAX_LENGTH) + "…" : details;
        attributes.setAttribute(ATTRIBUTE, trimmed, RequestAttributes.SCOPE_REQUEST);
    }
}
