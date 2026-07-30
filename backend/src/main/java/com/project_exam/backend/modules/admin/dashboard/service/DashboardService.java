package com.project_exam.backend.modules.admin.dashboard.service;

import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse.TestStat;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.*;
import com.project_exam.backend.modules.admin.dashboard.dto.MonthlyPerformanceResponse;
import com.project_exam.backend.modules.analytics.repository.PageVisitRepository;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project_exam.backend.shared.util.AppTime;

import java.time.*;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Tổng hợp số liệu Dashboard admin từ DB (đọc thuần, {@code readOnly}).
 *
 * <p>Dữ liệu ở quy mô đồ án nên các biểu đồ theo ngày/tháng lấy list trong cửa sổ thời gian rồi
 * gom nhóm bằng Java — vừa gọn vừa không phụ thuộc hàm date của một hệ CSDL cụ thể.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final ClassRepository classRepository;
    private final UserTestRepository userTestRepository;
    private final PageVisitRepository pageVisitRepository;
    private final ExamTypeRepository examTypeRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        LocalDate today = AppTime.today();

        return new DashboardStatsResponse(
                buildStats(),
                buildTraffic(today),
                buildStatusDistribution()
        );
    }

    /** Khoảng nghỉ (phút) để tách 2 phiên truy cập: quay lại sau ngần này = phiên mới. */
    private static final long SESSION_GAP_MINUTES = 30;
    /** Cùng ngưỡng nhưng tính theo giây để so sánh chính xác (không cắt cụt phần giây). */
    private static final long SESSION_GAP_SECONDS = SESSION_GAP_MINUTES * 60;

    // ── Traffic thật (bảng page_visits) ──────────────────────────
    private Traffic buildTraffic(LocalDate today) {
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDate weekStartDate = today.minusDays(6);
        LocalDateTime weekStart = weekStartDate.atStartOfDay();

        // Gom "phiên truy cập" theo quy tắc nghỉ 30 phút. Quét 8 ngày (đủ cho heatmap 7 ngày + đệm).
        List<SessionStart> sessions = computeSessionStarts(today.minusDays(8).atStartOfDay());

        long visitsToday = sessions.stream()
                .filter(s -> !s.time().isBefore(todayStart)).count();

        // Heatmap lượt TRUY CẬP (phiên) theo NGÀY × GIỜ, 7 ngày gần nhất.
        List<DayHours> heatmap = buildHeatmap(today);

        // Top quốc gia (geo-IP) — 7 ngày.
        List<CountryTraffic> topCountries = pageVisitRepository.findTopCountriesSince(AppTime.instant(weekStart), PageRequest.of(0, 50))
                .stream()
                .map(row -> new CountryTraffic((String) row[0], (String) row[1], ((Number) row[2]).longValue()))
                .collect(Collectors.toList());

        return new Traffic(
                visitsToday,
                heatmap,
                topCountries
        );
    }

    /**
     * Điểm bắt đầu mỗi phiên (thời điểm + userId) — 1 phiên = chuỗi lượt xem cách nhau ≤ 30 phút.
     *
     * <p>{@code from} là mốc theo lịch địa phương (báo cáo cắt theo ngày VN); DB lưu
     * {@link Instant} nên quy đổi ở đúng ranh giới này qua {@link AppTime}.
     */
    private List<SessionStart> computeSessionStarts(LocalDateTime from) {
        return sessionStartsFromRows(pageVisitRepository.findSessionRowsSince(AppTime.instant(from)));
    }

    /** Gom các dòng (sessionKey, createdAt, userId) đã sort thành điểm bắt đầu phiên (nghỉ > 30 phút = phiên mới). */
    private List<SessionStart> sessionStartsFromRows(List<Object[]> rows) {
        List<SessionStart> starts = new ArrayList<>();
        String prevKey = null;
        LocalDateTime prevTime = null;
        for (Object[] row : rows) {
            String key = (String) row[0]; // sessionKey = analyticsVisitorId (ổn định qua login/logout)
            LocalDateTime ts = AppTime.local((Instant) row[1]);
            String userId = (String) row[2];
            // Không có sessionKey -> không định danh được khách, coi mỗi lượt là 1 phiên riêng
            // (tránh gộp nhầm nhiều khách key null — vốn sort cạnh nhau — thành chung phiên).
            boolean newSession = key == null
                    || !java.util.Objects.equals(key, prevKey)
                    || prevTime == null
                    || ChronoUnit.SECONDS.between(prevTime, ts) > SESSION_GAP_SECONDS;
            if (newSession) {
                starts.add(new SessionStart(ts, userId));
            }
            prevKey = key;
            prevTime = ts;
        }
        return starts;
    }

    private record SessionStart(LocalDateTime time, String userId) {}

    /**
     * Heatmap lượt truy cập (phiên) theo NGÀY × GIỜ cho 7 ngày kết thúc ở {@code endDate}.
     * Dùng cho card Dashboard: mặc định 7 ngày gần nhất, lọc theo ngày để xem tuần trong quá khứ.
     */
    @Transactional(readOnly = true)
    public List<DayHours> getTrafficHeatmap(LocalDate endDateParam) {
        LocalDate today = AppTime.today();
        // Chỉ tính hiện tại & quá khứ — ngày tương lai (hoặc bỏ trống) đưa về hôm nay.
        LocalDate end = (endDateParam == null || endDateParam.isAfter(today)) ? today : endDateParam;
        return buildHeatmap(end);
    }

    /** Dựng heatmap NGÀY × GIỜ cho cửa sổ 7 ngày kết thúc ở {@code endDate}. */
    private List<DayHours> buildHeatmap(LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);
        // Quét thêm 1 ngày đệm trước ngày đầu: phiên bắt đầu từ hôm trước rồi kéo qua nửa đêm
        // sẽ được nhận diện đúng là phiên cũ (không bị tính thành phiên mới của ngày đầu).
        // Bucket bên dưới chỉ có 7 ngày nên các phiên rơi vào ngày đệm tự bị bỏ qua.
        LocalDateTime scanFrom = startDate.minusDays(1).atStartOfDay();
        LocalDateTime scanTo = endDate.plusDays(1).atStartOfDay();

        Map<LocalDate, long[]> heatBuckets = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            heatBuckets.put(startDate.plusDays(i), new long[24]);
        }
        for (SessionStart s : sessionStartsFromRows(
                pageVisitRepository.findSessionRowsBetween(AppTime.instant(scanFrom), AppTime.instant(scanTo)))) {
            long[] hrs = heatBuckets.get(s.time().toLocalDate());
            if (hrs != null) hrs[s.time().getHour()]++;
        }

        List<DayHours> heatmap = new ArrayList<>();
        for (Map.Entry<LocalDate, long[]> e : heatBuckets.entrySet()) {
            String label = e.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            List<Long> hours = new ArrayList<>(24);
            for (long v : e.getValue()) hours.add(v);
            heatmap.add(new DayHours(label, hours));
        }
        return heatmap;
    }

    // ── Thẻ tổng quan ────────────────────────────────────────────
    private Stats buildStats() {
        return new Stats(
                userRepository.count(),
                testRepository.count(),
                questionRepository.count(),
                classRepository.count(),
                userTestRepository.count(),
                userTestRepository.countByStatus(UserTest.Status.COMPLETED),
                examTypeRepository.countRootStandard()
        );
    }

    // ── Hiệu suất 12 tháng của một năm được chọn ─────────────────
    @Transactional(readOnly = true)
    public MonthlyPerformanceResponse getMonthlyPerformance(Integer yearParam) {
        int currentYear = AppTime.today().getYear();
        int year = yearParam == null ? currentYear : yearParam;

        // Danh sách năm chọn: từ năm hiện tại về năm có dữ liệu sớm nhất (lượt thi HOẶC đăng ký).
        Instant earliestAttempt = userTestRepository.findEarliestStartedAt();
        Instant earliestUser = userRepository.findEarliestCreatedAt();
        int startYear = currentYear;
        if (earliestAttempt != null) startYear = Math.min(startYear, AppTime.local(earliestAttempt).getYear());
        if (earliestUser != null) startYear = Math.min(startYear, AppTime.local(earliestUser).getYear());
        List<Integer> availableYears = new ArrayList<>();
        for (int y = currentYear; y >= startYear; y--) availableYears.add(y);

        LocalDateTime yearStart = LocalDate.of(year, 1, 1).atStartOfDay();

        // Gom lượt thi của năm được chọn theo 12 tháng: [total, completed].
        long[][] buckets = new long[12][2];
        for (Object[] row : userTestRepository.findAttemptsSince(AppTime.instant(yearStart))) {
            LocalDateTime startedAt = AppTime.local((Instant) row[0]);
            if (startedAt.getYear() != year) continue;
            UserTest.Status status = (UserTest.Status) row[2];
            long[] b = buckets[startedAt.getMonthValue() - 1];
            b[0]++;
            if (status == UserTest.Status.COMPLETED) b[1]++;
        }

        // Gom người dùng mới đăng ký của năm được chọn theo 12 tháng.
        long[] newUsers = new long[12];
        for (Instant createdAtUtc : userRepository.findCreatedAtSince(AppTime.instant(yearStart))) {
            LocalDateTime createdAt = AppTime.local(createdAtUtc);
            if (createdAt.getYear() != year) continue;
            newUsers[createdAt.getMonthValue() - 1]++;
        }

        // Gom lượt truy cập (phiên) của năm được chọn theo 12 tháng, kèm phân bố giờ để tìm giờ cao điểm.
        long[] visits = new long[12];
        long[][] hourHistogram = new long[12][24]; // [tháng][giờ] = số phiên
        for (SessionStart s : computeSessionStarts(yearStart)) {
            if (s.time().getYear() != year) continue;
            int m = s.time().getMonthValue() - 1;
            visits[m]++;
            hourHistogram[m][s.time().getHour()]++;
        }

        List<MonthPerformance> months = new ArrayList<>();
        for (int m = 0; m < 12; m++) {
            String label = Month.of(m + 1).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            long total = buckets[m][0];
            long completed = buckets[m][1];
            long rate = total == 0 ? 0 : Math.round(completed * 100.0 / total);
            months.add(new MonthPerformance(label, total, rate, newUsers[m], visits[m], peakHour(hourHistogram[m])));
        }
        return new MonthlyPerformanceResponse(year, availableYears, months);
    }

    /** Giờ có nhiều phiên nhất trong 1 tháng (0..23); {@code null} nếu tháng chưa có truy cập. */
    private static Integer peakHour(long[] hourHistogram) {
        int best = -1;
        long max = 0;
        for (int h = 0; h < hourHistogram.length; h++) {
            if (hourHistogram[h] > max) {
                max = hourHistogram[h];
                best = h;
            }
        }
        return best < 0 ? null : best;
    }

    // ── Tình trạng lượt thi ──────────────────────────────────────
    private List<NameValue> buildStatusDistribution() {
        List<NameValue> result = new ArrayList<>();
        result.add(new NameValue("Hoàn thành", userTestRepository.countByStatus(UserTest.Status.COMPLETED)));
        result.add(new NameValue("Đang làm", userTestRepository.countByStatus(UserTest.Status.IN_PROGRESS)));
        result.add(new NameValue("Hết hạn", userTestRepository.countByStatus(UserTest.Status.EXPIRED)));
        return result;
    }

    // ── Phân tích nội dung: bài công khai làm nhiều nhất ─────────
    private static final int TOP_TESTS_LIMIT = 8;

    @Transactional(readOnly = true)
    public ContentInsightsResponse getContentInsights() {
        return new ContentInsightsResponse(
                buildTopTests(userTestRepository.aggregateFullTestStats(
                        UserTest.Status.COMPLETED, UserTest.Mode.FULL_TEST)),
                buildTopTests(userTestRepository.aggregatePracticeTestStats(
                        UserTest.Status.COMPLETED, UserTest.Mode.PRACTICE))
        );
    }

    /** Top bài theo tổng lượt làm (từ rows đã gom theo bài); kèm tỉ lệ hoàn thành & điểm TB. */
    private List<TestStat> buildTopTests(List<Object[]> aggregated) {
        List<Object[]> rows = new ArrayList<>(aggregated);
        rows.sort((a, b) -> Long.compare(((Number) b[1]).longValue(), ((Number) a[1]).longValue()));
        List<Object[]> top = rows.stream().limit(TOP_TESTS_LIMIT).collect(Collectors.toList());

        List<String> testIds = top.stream().map(r -> (String) r[0]).collect(Collectors.toList());
        Map<String, String> titles = testRepository.findAllById(testIds).stream()
                .collect(Collectors.toMap(Test::getTestId, Test::getTitle));

        List<TestStat> result = new ArrayList<>();
        for (Object[] r : top) {
            String testId = (String) r[0];
            long attempts = ((Number) r[1]).longValue();
            long completed = r[2] == null ? 0 : ((Number) r[2]).longValue();
            long rate = attempts == 0 ? 0 : Math.round(completed * 100.0 / attempts);
            result.add(new TestStat(testId, titles.getOrDefault(testId, "(đã xoá)"),
                    attempts, completed, rate));
        }
        return result;
    }
}
