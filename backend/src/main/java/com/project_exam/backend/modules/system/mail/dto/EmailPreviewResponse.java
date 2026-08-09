package com.project_exam.backend.modules.system.mail.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmailPreviewResponse {
    private String subject;
    private String bodyHtml;
}
