package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.mapper.TestMapper;
import com.project_exam.backend.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TestSummaryAssembler {

    private final UserTestRepository userTestRepository;
    private final TestAccessPolicy accessPolicy;
    private final TestMapper testMapper;

    public PageResponse<TestResponse> toTestPageResponse(Page<Test> testPage, String userId) {
        return PageResponse.from(testPage, buildUserTestSummariesBatch(testPage.getContent(), userId));
    }

    public List<TestResponse> buildUserTestSummariesBatch(List<Test> tests, String userId) {
        if (tests.isEmpty()) return List.of();
        List<String> testIds = tests.stream().map(Test::getTestId).toList();

        Map<String, Long> totalAttemptsByTest = userTestRepository.countGroupedByTestIdIn(testIds)
                .stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        Map<String, Long> attemptsUsedByTest = userId != null
                ? userTestRepository.countGroupedByTestIdInAndUserId(testIds, userId).stream()
                        .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]))
                : Map.of();

        Set<String> purchasedTestIds = accessPolicy.purchasedTestIds(userId);

        return tests.stream()
                .map(test -> buildUserTestSummaryFromCounts(
                        test, userId,
                        attemptsUsedByTest.getOrDefault(test.getTestId(), 0L),
                        totalAttemptsByTest.getOrDefault(test.getTestId(), 0L),
                        purchasedTestIds))
                .toList();
    }

    public TestResponse buildUserTestSummary(Test test, String userId) {
        long attemptsUsed = 0;
        if (userId != null) {
            attemptsUsed = userTestRepository.countByTestIdAndUserId(test.getTestId(), userId);
        }
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());

        Integer maxAttempts = test.getMaxAttempts();
        Integer remainingAttempts = null;
        boolean canDoTest = true;

        if (maxAttempts != null) {
            remainingAttempts = (int) Math.max(0, maxAttempts - attemptsUsed);
            canDoTest = userId == null || remainingAttempts > 0;
        }

        boolean owned = accessPolicy.hasAccess(test, userId);
        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;

        return testMapper.toSummaryResponse(
                test, maxAttempts, (int) attemptsUsed, remainingAttempts, totalAttempts,
                canDoTest, owned, paid && !owned, test.calculateStatus().name());
    }

    public List<TestAdminResponse> buildAdminTestSummariesBatch(List<Test> tests) {
        if (tests.isEmpty()) return List.of();
        List<String> testIds = tests.stream().map(Test::getTestId).toList();
        Map<String, Long> totalAttemptsByTest = userTestRepository.countGroupedByTestIdIn(testIds)
                .stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        return tests.stream()
                .map(t -> testMapper.toAdminSummaryResponse(
                        t, totalAttemptsByTest.getOrDefault(t.getTestId(), 0L), t.calculateStatus().name()))
                .toList();
    }

    private TestResponse buildUserTestSummaryFromCounts(
            Test test, String userId, long attemptsUsed, long totalAttempts, Set<String> purchasedTestIds) {
        Integer maxAttempts = test.getMaxAttempts();
        Integer remainingAttempts = null;
        boolean canDoTest = true;

        if (maxAttempts != null) {
            remainingAttempts = (int) Math.max(0, maxAttempts - attemptsUsed);
            canDoTest = userId == null || remainingAttempts > 0;
        }

        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        boolean owned = accessPolicy.hasAccess(test, userId, purchasedTestIds);

        return testMapper.toSummaryResponse(
                test, maxAttempts, (int) attemptsUsed, remainingAttempts, totalAttempts,
                canDoTest, owned, paid && !owned, test.calculateStatus().name());
    }
}
