package com.project_exam.backend.modules.system.mail.dto;

import com.project_exam.backend.modules.system.mail.domain.EmailType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class EmailResponse {
    private String emailId;
    private EmailType type;
    private String typeLabel;
    private String code;
    private String name;
    private String description;
    private String subject;
    private String bodyHtml;
    private List<String> availableVars;
    private Boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    private long totalCount;
    private long sentCount;
    private long failedCount;
    private long pendingCount;
}
