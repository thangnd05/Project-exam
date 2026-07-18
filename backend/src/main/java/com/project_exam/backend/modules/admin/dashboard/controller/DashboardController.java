package com.project_exam.backend.modules.admin.dashboard.controller;

import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.DayHours;
import com.project_exam.backend.modules.admin.dashboard.dto.MonthlyPerformanceResponse;
import com.project_exam.backend.modules.admin.dashboard.service.DashboardService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthUtils authUtils;

    /** Tổng quan thống kê hệ thống cho trang Dashboard admin. */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        authUtils.requirePermission(PermissionCatalog.DASHBOARD_VIEW);
        return ResponseEntity.ok(dashboardService.getStats());
    }

    /** Hiệu suất đủ 12 tháng của một năm được chọn (mặc định năm hiện tại). */
    @GetMapping("/monthly-performance")
    public ResponseEntity<MonthlyPerformanceResponse> getMonthlyPerformance(
            @RequestParam(required = false) Integer year) {
        authUtils.requirePermission(PermissionCatalog.DASHBOARD_VIEW);
        return ResponseEntity.ok(dashboardService.getMonthlyPerformance(year));
    }

    /** Phân tích nội dung: bài thi hoạt động nhiều nhất & câu hỏi khó nhất (chỉ trang Thống kê gọi). */
    @GetMapping("/content-insights")
    public ResponseEntity<ContentInsightsResponse> getContentInsights() {
        authUtils.requirePermission(PermissionCatalog.DASHBOARD_VIEW);
        return ResponseEntity.ok(dashboardService.getContentInsights());
    }

    /** Heatmap NGÀY × GIỜ cho 7 ngày kết thúc ở ngày được chọn (mặc định/tương lai → hôm nay). */
    @GetMapping("/traffic-heatmap")
    public ResponseEntity<List<DayHours>> getTrafficHeatmap(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        authUtils.requirePermission(PermissionCatalog.DASHBOARD_VIEW);
        return ResponseEntity.ok(dashboardService.getTrafficHeatmap(endDate));
    }
}
