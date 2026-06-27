package com.project_exam.backend.modules.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Dữ liệu cho biểu đồ hoạt động học tập ở Dashboard cá nhân.
 * Trung lập với loại đề: đo theo THỜI GIAN làm bài (phút), không theo lượt/điểm.
 */
@Getter
@Builder
public class ProfileActivityResponse {
    /** Tháng đang xem, dạng "YYYY-MM". */
    private String month;
    /** Thời gian làm bài theo từng ngày trong tháng (đã điền đủ mọi ngày, kể cả ngày 0). */
    private List<DayActivity> days;
    /** Tổng số phút làm bài trong tháng. */
    private long totalMinutes;
    /** Số ngày có hoạt động trong tháng. */
    private long activeDays;
    /** Năm đang xem cho biểu đồ theo tháng, dạng "YYYY". */
    private String year;
    /** Tổng thời gian học của đủ 12 tháng trong năm đang xem (tháng 1 -> 12). */
    private List<MonthTime> monthlyTime;
    /** Danh sách tháng có thể chọn (mới nhất trước), dạng "YYYY-MM". */
    private List<String> availableMonths;
    /** Danh sách năm có thể chọn (mới nhất trước), dạng "YYYY". */
    private List<String> availableYears;

    @Getter
    @Builder
    public static class DayActivity {
        /** Ngày, dạng "YYYY-MM-DD". */
        private String date;
        /** Số thứ tự ngày trong tháng (1..31) — tiện hiển thị trục X. */
        private int day;
        /** Số phút làm bài trong ngày. */
        private long minutes;
    }

    @Getter
    @Builder
    public static class MonthTime {
        /** Tháng, dạng "YYYY-MM". */
        private String month;
        /** Tổng số phút làm bài trong tháng. */
        private long minutes;
    }
}
