package com.project_exam.backend.modules.admin.dashboard.dto;

import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.MonthPerformance;

import java.util.List;

/**
 * Hiệu suất theo tháng của MỘT năm được chọn (đủ 12 tháng Jan..Dec).
 *
 * @param year           năm đang xem
 * @param availableYears các năm có dữ liệu để chọn (mới → cũ)
 * @param months         12 tháng của năm đó (tháng chưa có dữ liệu = 0)
 */
public record MonthlyPerformanceResponse(
        int year,
        List<Integer> availableYears,
        List<MonthPerformance> months
) {}
