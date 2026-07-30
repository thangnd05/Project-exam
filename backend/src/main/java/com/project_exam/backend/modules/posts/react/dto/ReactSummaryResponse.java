package com.project_exam.backend.modules.posts.react.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ReactSummaryResponse {
    private Map<String, Long> counts;
    private String currentUserReactType;
    private long total;
}
