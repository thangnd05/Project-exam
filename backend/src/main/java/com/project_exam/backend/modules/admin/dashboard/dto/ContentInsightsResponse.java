package com.project_exam.backend.modules.admin.dashboard.dto;

import java.util.List;

/**
 * Phân tích NỘI DUNG cho trang Thống kê admin: bài thi công khai (không thuộc lớp) làm nhiều nhất,
 * tách theo chế độ — làm full ({@code topTests}) và luyện tập ({@code topPracticeTests}).
 *
 * <p>Tách khỏi {@code DashboardStatsResponse} vì đây là số liệu "đào sâu" (nặng hơn, ít đổi),
 * chỉ trang Thống kê gọi — không nằm trong endpoint tự làm mới mỗi 30s của Dashboard.
 */
public record ContentInsightsResponse(
        List<TestStat> topTests,
        List<TestStat> topPracticeTests
) {
    /** Một bài thi: tổng lượt làm, số hoàn thành, tỉ lệ hoàn thành (%). */
    public record TestStat(String testId, String title, long attempts, long completed,
                           long completionRate) {}
}
