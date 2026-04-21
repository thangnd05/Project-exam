package com.project_exam.backend.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class AuditLogPageResponse {
    private List<AuditLogResponse> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
