package com.project_exam.backend.modules.admin.dashboard.service;

import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse.TestStat;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.*;
import com.project_exam.backend.modules.admin.dashboard.dto.MonthlyPerformanceResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.TrafficLocationsResponse;
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

    private static final long SESSION_GAP_MINUTES = 30;

    private static final long SESSION_GAP_SECONDS = SESSION_GAP_MINUTES * 60;

    private Traffic buildTraffic(LocalDate today) {
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDate weekStartDate = today.minusDays(6);
        LocalDateTime weekStart = weekStartDate.atStartOfDay();

        List<SessionStart> sessions = computeSessionStarts(today.minusDays(8).atStartOfDay());

        long visitsToday = sessions.stream()
                .filter(s -> !s.time().isBefore(todayStart)).count();

        List<DayHours> heatmap = buildHeatmap(today);

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

    private List<SessionStart> computeSessionStarts(LocalDateTime from) {
        return sessionStartsFromRows(pageVisitRepository.findSessionRowsSince(AppTime.instant(from)));
    }

    private List<SessionStart> sessionStartsFromRows(List<Object[]> rows) {
        List<SessionStart> starts = new ArrayList<>();
        String prevKey = null;
        LocalDateTime prevTime = null;
        for (Object[] row : rows) {
            String key = (String) row[0];
            LocalDateTime ts = AppTime.local((Instant) row[1]);
            String userId = (String) row[2];

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

    private static final int TOP_COUNTRIES_LIMIT = 50;

    @Transactional(readOnly = true)
    public TrafficLocationsResponse getTrafficLocations(YearMonth monthParam) {
        YearMonth currentMonth = YearMonth.from(AppTime.today());
        YearMonth month = (monthParam == null || monthParam.isAfter(currentMonth)) ? currentMonth : monthParam;

        Instant earliestVisit = pageVisitRepository.findEarliestCreatedAt();
        YearMonth startMonth = earliestVisit == null ? currentMonth : AppTime.yearMonth(earliestVisit);
        if (startMonth.isAfter(month)) startMonth = month;
        List<String> availableMonths = new ArrayList<>();
        for (YearMonth m = currentMonth; !m.isBefore(startMonth); m = m.minusMonths(1)) {
            availableMonths.add(m.toString());
        }

        LocalDateTime monthStart = month.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = month.plusMonths(1).atDay(1).atStartOfDay();

        // quét sớm 1 ngày để nhận diện phiên bắt đầu từ tháng trước, rồi loại chúng ra
        List<Object[]> rows = pageVisitRepository.findLocationRowsBetween(
                AppTime.instant(monthStart.minusDays(1)), AppTime.instant(monthEnd));

        Map<String, long[]> countByCode = new HashMap<>();
        Map<String, String> nameByCode = new HashMap<>();

        String prevKey = null;
        LocalDateTime prevTime = null;
        for (Object[] row : rows) {
            String key = (String) row[0];
            LocalDateTime ts = AppTime.local((Instant) row[1]);
            String code = (String) row[2];
            String name = (String) row[3];

            boolean newSession = key == null
                    || !Objects.equals(key, prevKey)
                    || prevTime == null
                    || ChronoUnit.SECONDS.between(prevTime, ts) > SESSION_GAP_SECONDS;
            prevKey = key;
            prevTime = ts;

            // chỉ tính phiên bắt đầu trong tháng và đến từ IP công cộng
            if (!newSession || ts.isBefore(monthStart) || code == null || "LO".equals(code)) continue;

            countByCode.computeIfAbsent(code, k -> new long[1])[0]++;
            if (name != null) nameByCode.putIfAbsent(code, name);
        }

        List<CountryTraffic> topCountries = countByCode.entrySet().stream()
                .map(e -> new CountryTraffic(e.getKey(), nameByCode.getOrDefault(e.getKey(), e.getKey()), e.getValue()[0]))
                .sorted(Comparator.comparingLong(CountryTraffic::getValue).reversed()
                        .thenComparing(CountryTraffic::getName))
                .limit(TOP_COUNTRIES_LIMIT)
                .collect(Collectors.toList());

        long totalVisits = countByCode.values().stream().mapToLong(v -> v[0]).sum();

        return new TrafficLocationsResponse(
                month.toString(), totalVisits, availableMonths, topCountries);
    }

    @Transactional(readOnly = true)
    public List<DayHours> getTrafficHeatmap(LocalDate endDateParam) {
        LocalDate today = AppTime.today();

        LocalDate end = (endDateParam == null || endDateParam.isAfter(today)) ? today : endDateParam;
        return buildHeatmap(end);
    }

    private List<DayHours> buildHeatmap(LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);

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

    @Transactional(readOnly = true)
    public MonthlyPerformanceResponse getMonthlyPerformance(Integer yearParam) {
        int currentYear = AppTime.today().getYear();
        int year = yearParam == null ? currentYear : yearParam;

        Instant earliestAttempt = userTestRepository.findEarliestStartedAt();
        Instant earliestUser = userRepository.findEarliestCreatedAt();
        int startYear = currentYear;
        if (earliestAttempt != null) startYear = Math.min(startYear, AppTime.local(earliestAttempt).getYear());
        if (earliestUser != null) startYear = Math.min(startYear, AppTime.local(earliestUser).getYear());
        List<Integer> availableYears = new ArrayList<>();
        for (int y = currentYear; y >= startYear; y--) availableYears.add(y);

        LocalDateTime yearStart = LocalDate.of(year, 1, 1).atStartOfDay();

        long[][] buckets = new long[12][2];
        for (Object[] row : userTestRepository.findAttemptsSince(AppTime.instant(yearStart))) {
            LocalDateTime startedAt = AppTime.local((Instant) row[0]);
            if (startedAt.getYear() != year) continue;
            UserTest.Status status = (UserTest.Status) row[2];
            long[] b = buckets[startedAt.getMonthValue() - 1];
            b[0]++;
            if (status == UserTest.Status.COMPLETED) b[1]++;
        }

        long[] newUsers = new long[12];
        for (Instant createdAtUtc : userRepository.findCreatedAtSince(AppTime.instant(yearStart))) {
            LocalDateTime createdAt = AppTime.local(createdAtUtc);
            if (createdAt.getYear() != year) continue;
            newUsers[createdAt.getMonthValue() - 1]++;
        }

        long[] visits = new long[12];
        long[][] hourHistogram = new long[12][24];
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

    private List<NameValue> buildStatusDistribution() {
        List<NameValue> result = new ArrayList<>();
        result.add(new NameValue("Hoàn thành", userTestRepository.countByStatus(UserTest.Status.COMPLETED)));
        result.add(new NameValue("Đang làm", userTestRepository.countByStatus(UserTest.Status.IN_PROGRESS)));
        result.add(new NameValue("Hết hạn", userTestRepository.countByStatus(UserTest.Status.EXPIRED)));
        return result;
    }

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
