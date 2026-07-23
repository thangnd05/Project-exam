package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.dto.CreateTestRequest;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserAnswerRepository;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Tách khỏi TestService: các use-case GHI của đề — tạo/lưu, cập nhật, xoá (cascade).
 */
@Service
@RequiredArgsConstructor
public class TestCommandService {

    private final TestRepository testRepository;
    private final AuthUtils authUtils;
    private final ClassAccessGuard classAccessGuard;
    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;

    public Test save(Test test) {
        return testRepository.save(test);
    }

    @Transactional
    public void deleteTest(String id, HttpServletRequest httpRequest) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xóa đề này.");
        }
        cascadeDeleteTestInternal(id);
    }

    /**
     * Cascade xoá 1 đề: lượt làm (user_tests + user_answers), liên kết câu (test_questions),
     * test_parts, rồi tới chính test. KHÔNG xoá questions trong kho — chúng độc lập.
     * Không kiểm tra quyền — caller phải đảm bảo.
     */
    @Transactional
    public void cascadeDeleteTestInternal(String testId) {
        // 1. Lượt làm + đáp án người dùng
        List<UserTest> userTests = userTestRepository.findByTestId(testId);
        for (UserTest ut : userTests) {
            List<UserAnswer> uas = userAnswerRepository.findByUserTestId(ut.getUserTestId());
            if (!uas.isEmpty()) userAnswerRepository.deleteAll(uas);
        }
        if (!userTests.isEmpty()) userTestRepository.deleteAll(userTests);

        // 2. test_questions thuộc các test_part của đề
        List<TestPart> parts = testPartRepository.findByTestId(testId);
        for (TestPart p : parts) {
            testQuestionRepository.deleteByTestPartId(p.getTestPartId());
        }
        // 3. test_parts
        if (!parts.isEmpty()) testPartRepository.deleteAll(parts);

        // 4. test
        testRepository.deleteById(testId);
    }

    /**
     * Cập nhật test từ CreateTestRequest (dùng chung DTO với tạo mới).
     * Chỉ ghi đè các field được gửi lên (khác null); không đổi createdBy, createdAt.
     */
    public Test updateTest(String id, CreateTestRequest request, HttpServletRequest httpRequest) {

        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }
        //  Nếu đổi classId/chapterId, áp dụng cùng guard như khi tạo mới.
        String effectiveClassId = request.getClassId() != null ? request.getClassId() : test.getClassId();
        String effectiveChapterId = request.getChapterId() != null ? request.getChapterId() : test.getChapterId();
        if (request.getClassId() != null) {
            classAccessGuard.requireTeacher(effectiveClassId, currentUserId, httpRequest);
        }
        if (request.getChapterId() != null) {
            classAccessGuard.requireChapterInClass(effectiveChapterId, effectiveClassId);
        }

        if (request.getTitle() != null) test.setTitle(request.getTitle());
        if (request.getDescription() != null) test.setDescription(request.getDescription());
        if (request.getExamTypeId() != null) test.setExamTypeId(request.getExamTypeId());
        if (request.getDurationMinutes() != null) test.setDurationMinutes(request.getDurationMinutes());
        if (request.getBannerUrl() != null) test.setBannerUrl(request.getBannerUrl());
        if (request.getMaxAttempts() != null) test.setMaxAttempts(request.getMaxAttempts());
        if (request.getClassId() != null) test.setClassId(request.getClassId());
        if (request.getChapterId() != null) test.setChapterId(request.getChapterId());
        // examCategoryId: gửi chuỗi rỗng để gỡ phân loại, có giá trị để gán/đổi (giống collectionId).
        if (request.getExamCategoryId() != null) {
            test.setExamCategoryId(request.getExamCategoryId().isBlank() ? null : request.getExamCategoryId());
        }
        // collectionId: gửi chuỗi rỗng để gỡ bộ đề, có giá trị để gán/đổi.
        if (request.getCollectionId() != null) {
            test.setCollectionId(request.getCollectionId().isBlank() ? null : request.getCollectionId());
        }
        if (request.getAvailableFrom() != null) test.setAvailableFrom(request.getAvailableFrom());
        if (request.getAvailableTo() != null) test.setAvailableTo(request.getAvailableTo());
        // Giá xu: chỉ admin đặt được, và chỉ cho bài công khai (không gắn lớp). Đặt 0 để gỡ phí.
        if (request.getCostCoins() != null) {
            boolean publicTest = effectiveClassId == null;
            test.setCostCoins(authUtils.hasPermission(PermissionCatalog.TEST_MANAGE_PRICING) && publicTest ? request.getCostCoins() : null);
        }
        return testRepository.save(test);
    }
}
