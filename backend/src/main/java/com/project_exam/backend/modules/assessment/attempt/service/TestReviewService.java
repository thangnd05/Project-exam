package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.service.TestService;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

/**
 * Cửa duy nhất để người làm bài lấy đáp án đúng + giải thích.
 *
 * Trước đây màn xem lại gọi thẳng GET /api/tests/admintest/{testId}  endpoint đó public nên
 * ai cũng tải được đáp án của mọi đề mà không cần làm bài. Giờ mọi yêu cầu xem đáp án phải đi
 * kèm một lượt làm bài của chính mình, và lượt đó phải đã nộp.
 */
@Service
@RequiredArgsConstructor
public class TestReviewService {

    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final TestService testService;

    @Transactional(readOnly = true)
    public TestAdminResponse getReviewTestForUser(String userTestId, String userId) {
        UserTest userTest = loadAttempt(userTestId);
        if (userTest.getUserId() == null || !Objects.equals(userTest.getUserId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền xem đáp án của bài làm này.");
        }
        return buildReview(userTest);
    }

    @Transactional(readOnly = true)
    public TestAdminResponse getReviewTestForGuest(String userTestId, String guestSessionId) {
        UserTest userTest = loadAttempt(userTestId);
        if (guestSessionId == null || guestSessionId.isBlank()
                || !Objects.equals(userTest.getGuestSessionId(), guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return buildReview(userTest);
    }

    private UserTest loadAttempt(String userTestId) {
        return userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài làm"));
    }

    private TestAdminResponse buildReview(UserTest userTest) {
        if (userTest.getStatus() == UserTest.Status.IN_PROGRESS) {
            throw new ForbiddenException("Bài chưa nộp nên chưa xem được đáp án.");
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài kiểm tra"));

        // Đề còn trong thời gian mở thì chưa lộ đáp án  người nộp sớm không được phép
        // đi mách cho người chưa làm.
        if (test.getAvailableTo() != null && Instant.now().isBefore(test.getAvailableTo())) {
            throw new ForbiddenException("Đề vẫn đang mở, chưa tới lúc xem đáp án.");
        }

        return testService.getTestFullByIdAdmin(test.getTestId());
    }
}
