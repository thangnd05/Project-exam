package com.project_exam.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ReactSummaryResponse {
    private Map<String, Long> counts;       // {"LIKE": 5, "LOVE": 3, ...}
    private String currentUserReactType;    // null nếu chưa react
    private long total;
}
