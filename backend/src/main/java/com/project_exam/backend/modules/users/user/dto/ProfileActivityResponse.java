package com.project_exam.backend.modules.users.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProfileActivityResponse {

    private String month;

    private List<DayActivity> days;

    private long totalMinutes;

    private long activeDays;

    private String year;

    private List<MonthTime> monthlyTime;

    private List<String> availableMonths;

    private List<String> availableYears;

    @Getter
    @Builder
    public static class DayActivity {

        private String date;

        private int day;

        private long minutes;
    }

    @Getter
    @Builder
    public static class MonthTime {

        private String month;

        private long minutes;
    }
}
