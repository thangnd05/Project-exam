package com.project_exam.backend.modules.admin.dashboard.dto;

import java.util.List;

public record DashboardStatsResponse(
        Stats stats,
        Traffic traffic,
        List<NameValue> statusDistribution
) {
    public record Stats(
            long totalUsers,
            long totalTests,
            long totalQuestions,
            long totalClasses,
            long totalExamsTaken,
            long completedExams,
            long totalExamTypes
    ) {}

    public record NameValue(String name, long value) {}

    public record Traffic(
            long visitsToday,
            List<DayHours> heatmap,
            List<CountryTraffic> topCountries
    ) {}

    public record DayHours(String day, List<Long> hours) {}

    public record CountryTraffic(String code, String name, long value) {}

    public record MonthPerformance(String month, long tests, long rate, long newUsers, long visits, Integer peakHour) {}
}
