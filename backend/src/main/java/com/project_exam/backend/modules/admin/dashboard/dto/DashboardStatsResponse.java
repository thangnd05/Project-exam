package com.project_exam.backend.modules.admin.dashboard.dto;

import java.util.List;

/**
 * Tổng quan thống kê cho Dashboard admin — tất cả số liệu lấy trực tiếp từ DB.
 *
 * <p>Shape các list được thiết kế khớp thẳng với data key của biểu đồ Recharts phía FE
 * (day/users/exams, name/value, month/tests/rate, range/count…) để component chỉ việc render.
 * Các trend là % thay đổi 7 ngày gần nhất so với 7 ngày trước đó ({@code null} = không đủ dữ liệu, ẩn mũi tên).
 */
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
            long completedExams
    ) {}

    /** Cặp tên–giá trị dùng cho donut (loại kỳ thi, tình trạng lượt thi) và top trang. */
    public record NameValue(String name, long value) {}

    /** Số liệu lượt truy cập (traffic) thật, lấy từ bảng page_visits. */
    public record Traffic(
            long visitsToday,
            Integer visitsTrend,        // hôm nay vs hôm qua (%)
            long uniqueVisitorsWeek,    // khách duy nhất 7 ngày
            long totalVisitsWeek,       // tổng lượt xem trang 7 ngày
            List<DayHours> heatmap,     // lượt truy cập (phiên) theo NGÀY × GIỜ, 7 ngày gần nhất
            List<CountryTraffic> topCountries // vị trí truy cập 7 ngày
    ) {}

    /** Một ngày trong heatmap: nhãn ngày + số phiên theo từng giờ (24 phần tử, 0..23h). */
    public record DayHours(String day, List<Long> hours) {}

    /** Một quốc gia truy cập: mã ISO alpha-2, tên, số lượt. */
    public record CountryTraffic(String code, String name, long value) {}

    /**
     * Một tháng của biểu đồ theo năm: số lượt làm bài, tỉ lệ hoàn thành (%), số người dùng mới,
     * số lượt truy cập (phiên) và giờ cao điểm ({@code peakHour} = 0..23; {@code null} nếu tháng chưa có truy cập).
     */
    public record MonthPerformance(String month, long tests, long rate, long newUsers, long visits, Integer peakHour) {}
}
