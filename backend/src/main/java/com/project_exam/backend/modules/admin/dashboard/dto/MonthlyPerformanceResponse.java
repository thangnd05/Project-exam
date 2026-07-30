package com.project_exam.backend.modules.admin.dashboard.dto;

import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.MonthPerformance;

import java.util.List;

public record MonthlyPerformanceResponse(
        int year,
        List<Integer> availableYears,
        List<MonthPerformance> months
) {}
