package com.project_exam.backend.modules.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentInsightsResponse {
    private List<TestStat> topTests;
    private List<TestStat> topPracticeTests;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestStat {
        private String testId;
        private String title;
        private long attempts;
        private long completed;
        private long completionRate;
    }
}
