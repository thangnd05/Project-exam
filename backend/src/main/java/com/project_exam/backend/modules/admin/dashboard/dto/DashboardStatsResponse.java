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
public class DashboardStatsResponse {
    private Stats stats;
    private Traffic traffic;
    private List<NameValue> statusDistribution;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private long totalUsers;
        private long totalTests;
        private long totalQuestions;
        private long totalClasses;
        private long totalExamsTaken;
        private long completedExams;
        private long totalExamTypes;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NameValue {
        private String name;
        private long value;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Traffic {
        private long visitsToday;
        private List<DayHours> heatmap;
        private List<CountryTraffic> topCountries;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayHours {
        private String day;
        private List<Long> hours;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountryTraffic {
        private String code;
        private String name;
        private long value;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthPerformance {
        private String month;
        private long tests;
        private long rate;
        private long newUsers;
        private long visits;
        private Integer peakHour;
    }
}
