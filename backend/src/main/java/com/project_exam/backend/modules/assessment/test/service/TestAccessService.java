package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.UserTestAccess;
import com.project_exam.backend.modules.assessment.test.dto.CanStartTestResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.repository.UserTestAccessRepository;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TestAccessService {

    private final TestRepository testRepository;
    private final UserTestRepository userTestRepository;
    private final UserTestAccessRepository userTestAccessRepository;
    private final CoinService coinService;
    private final TestService testService;

    private boolean hasTestAccess(Test test, String userId) {
        if (test.getCostCoins() == null || test.getCostCoins() <= 0) return true;
        if (userId == null) return false;
        if (userId.equals(test.getCreatedBy())) return true;
        return userTestAccessRepository.existsByUserIdAndTestId(userId, test.getTestId());
    }

    public CanStartTestResponse canStartTest(String userId, Test test) {
        Instant now = Instant.now();

        if (test.getAvailableFrom() != null && test.getAvailableFrom().isAfter(now)) {
            return CanStartTestResponse.builder()
                    .canStart(false)
                    .message("Bài kiểm tra chưa bắt đầu")
                    .build();
        }

        if (test.getAvailableTo() != null && test.getAvailableTo().isBefore(now)) {
            return CanStartTestResponse.builder()
                    .canStart(false)
                    .message("Bài kiểm tra đã kết thúc")
                    .build();
        }

        int attemptsUsed = userTestRepository.countByUserIdAndTestIdAndStatus(
                userId,
                test.getTestId(),
                UserTest.Status.COMPLETED
        );
        Integer maxAttempts = test.getMaxAttempts();

        if (maxAttempts != null && attemptsUsed >= maxAttempts) {
            return CanStartTestResponse.builder()
                    .canStart(false)
                    .message("Bạn đã hết số lượt làm bài")
                    .build();
        }

        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        boolean owned = hasTestAccess(test, userId);
        if (paid && !owned) {
            return CanStartTestResponse.builder()
                    .canStart(false)
                    .message("Bài này cần mở khoá bằng xu trước khi làm.")
                    .costCoins(test.getCostCoins())
                    .owned(false)
                    .requiresPayment(true)
                    .build();
        }

        return CanStartTestResponse.builder()
                .canStart(true)
                .message("OK")
                .costCoins(test.getCostCoins())
                .owned(owned)
                .requiresPayment(false)
                .build();
    }

    @Transactional
    public TestResponse purchaseTestAccess(String userId, String testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + testId));
        Integer cost = test.getCostCoins();
        if (cost == null || cost <= 0) {
            throw new BadRequestException("Bài này miễn phí, không cần mua.");
        }
        if (test.getClassId() != null) {
            throw new BadRequestException("Bài của lớp không bán bằng xu.");
        }
        if (userTestAccessRepository.existsByUserIdAndTestId(userId, testId)) {
            throw new ConflictException("Bạn đã mở khoá bài này.");
        }

        coinService.spend(userId, cost);

        UserTestAccess access = new UserTestAccess();
        access.setUserId(userId);
        access.setTestId(testId);
        access.setPurchasedAt(Instant.now());
        userTestAccessRepository.save(access);

        return testService.buildUserTestSummary(test, userId);
    }
}
