package com.project_exam.backend.modules.admin.dashboard.dto;

import java.util.List;

public record ContentInsightsResponse(
        List<TestStat> topTests,
        List<TestStat> topPracticeTests
) {

    public record TestStat(String testId, String title, long attempts, long completed,
                           long completionRate) {}
}
