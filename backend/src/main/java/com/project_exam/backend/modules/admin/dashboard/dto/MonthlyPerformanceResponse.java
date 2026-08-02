package com.project_exam.backend.modules.admin.dashboard.dto;

import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.MonthPerformance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyPerformanceResponse {
    private int year;
    private List<Integer> availableYears;
    private List<MonthPerformance> months;
}
