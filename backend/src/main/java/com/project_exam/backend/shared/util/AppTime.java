package com.project_exam.backend.shared.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;

public final class AppTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private AppTime() {
    }

    public static LocalDateTime local(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONE);
    }

    public static LocalDate localDate(Instant instant) {
        return instant == null ? null : instant.atZone(ZONE).toLocalDate();
    }

    public static YearMonth yearMonth(Instant instant) {
        return instant == null ? null : YearMonth.from(instant.atZone(ZONE));
    }

    public static Instant instant(LocalDateTime local) {
        return local == null ? null : local.atZone(ZONE).toInstant();
    }

    public static Instant startOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay(ZONE).toInstant();
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
