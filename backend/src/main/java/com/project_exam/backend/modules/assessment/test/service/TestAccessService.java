package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.UserTestAccess;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.repository.UserTestAccessRepository;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Tách khỏi TestService: kiểm soát QUYỀN LÀM BÀI — điều kiện bắt đầu (canStartTest)
 * và mua quyền bài trả phí bằng xu (purchaseTestAccess).
 */
@Service
@RequiredArgsConstructor
public class TestAccessService {

    private final TestRepository testRepository;
    private final UserTestRepository userTestRepository;
    private final UserTestAccessRepository userTestAccessRepository;
    private final CoinService coinService;
    private final TestService testService; // dùng lại buildUserTestSummary (query)

    private boolean hasTestAccess(Test test, String userId) {
        if (test.getCostCoins() == null || test.getCostCoins() <= 0) return true;
        if (userId == null) return false;
        if (userId.equals(test.getCreatedBy())) return true;
        return userTestAccessRepository.existsByUserIdAndTestId(userId, test.getTestId());
    }


    public Map<String, Object> canStartTest(String userId, Test test) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> result = new HashMap<>();

        if (test.getAvailableFrom() != null && test.getAvailableFrom().isAfter(now)) {
            result.put("canStart", false);
            result.put("message", "Bài kiểm tra chưa bắt đầu");
            return result;
        }

        if (test.getAvailableTo() != null && test.getAvailableTo().isBefore(now)) {
            result.put("canStart", false);
            result.put("message", "Bài kiểm tra đã kết thúc");
            return result;
        }

        int attemptsUsed = userTestRepository.countByUserIdAndTestIdAndStatus(
                userId,
                test.getTestId(),
                UserTest.Status.COMPLETED
        );        Integer maxAttempts = test.getMaxAttempts();

        if (maxAttempts != null && attemptsUsed >= maxAttempts) {
            result.put("canStart", false);
            result.put("message", "Bạn đã hết số lượt làm bài");
            return result;
        }

        // Bài trả phí: lộ giá + trạng thái sở hữu để FE hiển thị nút "Mở khoá".
        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        boolean owned = hasTestAccess(test, userId);
        result.put("costCoins", test.getCostCoins());
        result.put("owned", owned);
        result.put("requiresPayment", paid && !owned);
        if (paid && !owned) {
            result.put("canStart", false);
            result.put("message", "Bài này cần mở khoá bằng xu trước khi làm.");
            return result;
        }

        result.put("canStart", true);
        result.put("message", "OK");
        return result;
    }

    /** Mua quyền làm bài trả phí (trừ xu 1 lần, mở khoá vĩnh viễn). */
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

        coinService.spend(userId, cost); // ném lỗi nếu không đủ xu

        UserTestAccess access = new UserTestAccess();
        access.setUserId(userId);
        access.setTestId(testId);
        access.setPurchasedAt(LocalDateTime.now());
        userTestAccessRepository.save(access);

        return testService.buildUserTestSummary(test, userId);
    }
}
