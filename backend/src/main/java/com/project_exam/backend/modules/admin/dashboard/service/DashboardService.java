package com.project_exam.backend.modules.admin.dashboard.service;

import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.ContentInsightsResponse.TestStat;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.DashboardStatsResponse.*;
import com.project_exam.backend.modules.admin.dashboard.dto.MonthlyPerformanceResponse;
import com.project_exam.backend.modules.admin.dashboard.dto.TrafficLocationsResponse;
import com.project_exam.backend.modules.system.analytics.repository.PageVisitRepository;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project_exam.backend.shared.util.AppTime;

import java.time.*;
import java.time.format.TextStyle;
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

    private static final int TOP_COUNTRIES_LIMIT = 50;

    private Traffic buildTraffic(LocalDate today) {
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime weekStart = today.minusDays(6).atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();

        long visitsToday = pageVisitRepository.countByCreatedAtGreaterThanEqual(AppTime.instant(todayStart));

        List<DayHours> heatmap = buildHeatmap(today);

        List<CountryTraffic> topCountries = topCountriesBetween(weekStart, tomorrowStart);

        return new Traffic(
                visitsToday,
                heatmap,
                topCountries
        );
    }

    private List<CountryTraffic> countryCountsBetween(LocalDateTime from, LocalDateTime to) {
        return pageVisitRepository.countByCountryBetween(AppTime.instant(from), AppTime.instant(to))
                .stream()
                .map(row -> new CountryTraffic((String) row[0],
                        row[1] != null ? (String) row[1] : (String) row[0],
                        ((Number) row[2]).longValue()))
                .collect(Collectors.toList());
    }

    private List<CountryTraffic> topCountries(List<CountryTraffic> counts) {
        return counts.stream()
                .sorted(Comparator.comparingLong(CountryTraffic::getValue).reversed()
                        .thenComparing(CountryTraffic::getName))
                .limit(TOP_COUNTRIES_LIMIT)
                .collect(Collectors.toList());
    }

    private List<CountryTraffic> topCountriesBetween(LocalDateTime from, LocalDateTime to) {
        return topCountries(countryCountsBetween(from, to));
    }

    private List<LocalDateTime> visitTimesBetween(LocalDateTime from, LocalDateTime to) {
        return pageVisitRepository.findCreatedAtBetween(AppTime.instant(from), AppTime.instant(to))
                .stream()
                .map(AppTime::local)
                .collect(Collectors.toList());
    }

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

        List<CountryTraffic> counts = countryCountsBetween(monthStart, monthEnd);
        long totalVisits = counts.stream().mapToLong(CountryTraffic::getValue).sum();

        return new TrafficLocationsResponse(
                month.toString(), totalVisits, availableMonths, topCountries(counts));
    }

    @Transactional(readOnly = true)
    public List<DayHours> getTrafficHeatmap(LocalDate endDateParam) {
        LocalDate today = AppTime.today();

        LocalDate end = (endDateParam == null || endDateParam.isAfter(today)) ? today : endDateParam;
        return buildHeatmap(end);
    }

    private List<DayHours> buildHeatmap(LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);

        Map<LocalDate, long[]> heatBuckets = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            heatBuckets.put(startDate.plusDays(i), new long[24]);
        }
        for (LocalDateTime t : visitTimesBetween(startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay())) {
            long[] hrs = heatBuckets.get(t.toLocalDate());
            if (hrs != null) hrs[t.getHour()]++;
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
        for (LocalDateTime t : visitTimesBetween(yearStart, yearStart.plusYears(1))) {
            int m = t.getMonthValue() - 1;
            visits[m]++;
            hourHistogram[m][t.getHour()]++;
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
