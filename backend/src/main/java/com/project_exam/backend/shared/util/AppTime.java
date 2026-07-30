package com.project_exam.backend.shared.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * Quy đổi giữa mốc thời gian tuyệt đối và lịch địa phương.
 *
 * <p>Mọi cột thời gian trong DB là {@code timestamptz} và mọi field entity là
 * {@link Instant} — tức một điểm trên trục thời gian, không kèm múi giờ. Nhưng
 * các báo cáo theo "ngày", "tháng", "giờ cao điểm" thì phải tính theo lịch mà
 * người dùng nhìn thấy. Lớp này là ranh giới duy nhất giữa hai thế giới đó:
 * dùng nó khi (và chỉ khi) cần gom nhóm/hiển thị theo lịch.
 *
 * <p>Việt Nam không có DST nên quy đổi luôn ổn định.
 */
public final class AppTime {

    /** Múi giờ nghiệp vụ — mốc để cắt ngày/tháng cho thống kê và chuỗi streak. */
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private AppTime() {
    }

    /** Giờ địa phương tương ứng một mốc tuyệt đối. */
    public static LocalDateTime local(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONE);
    }

    /** Ngày địa phương chứa mốc tuyệt đối. */
    public static LocalDate localDate(Instant instant) {
        return instant == null ? null : instant.atZone(ZONE).toLocalDate();
    }

    /** Tháng địa phương chứa mốc tuyệt đối. */
    public static YearMonth yearMonth(Instant instant) {
        return instant == null ? null : YearMonth.from(instant.atZone(ZONE));
    }

    /** Mốc tuyệt đối của một giờ địa phương. */
    public static Instant instant(LocalDateTime local) {
        return local == null ? null : local.atZone(ZONE).toInstant();
    }

    /** Mốc tuyệt đối lúc 00:00 giờ địa phương của một ngày. */
    public static Instant startOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay(ZONE).toInstant();
    }

    /** Hôm nay theo lịch địa phương. */
    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
