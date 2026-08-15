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
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
    private final ExamCategoryRepository examCategoryRepository;

    public Test save(Test test) {
        return testRepository.save(test);
    }

    /**
     * Lọc nhóm đề trước khi gán cho bài kiểm tra.
     *
     * Nhóm đề có cờ certificate_eligible sinh ra chứng chỉ khi người học đạt điểm, nên người
     * dùng thường không được tự gắn: nếu không chặn thì ai cũng tạo được một đề 5 câu tự soạn,
     * gắn nhóm "Full Mock" rồi tự cấp chứng chỉ cho mình. Cùng cách costCoins chỉ nhận khi có
     * quyền TEST:MANAGE_PRICING.
     *
     * Trả về null (không gán nhóm) thay vì ném lỗi để luồng tạo đề cá nhân vẫn chạy bình thường.
     */
    public String sanitizeExamCategoryId(String examCategoryId) {
        if (examCategoryId == null || examCategoryId.isBlank()) {
            return null;
        }
        if (authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            return examCategoryId;
        }
        boolean certificateEligible = examCategoryRepository.findById(examCategoryId)
                .map(c -> Boolean.TRUE.equals(c.getCertificateEligible()))
                .orElse(false);
        return certificateEligible ? null : examCategoryId;
    }

    @Transactional
    public void deleteTest(String id, String currentUserId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xóa đề này.");
        }
        cascadeDeleteTestInternal(id);
    }

    @Transactional
    public void cascadeDeleteTestInternal(String testId) {

        List<UserTest> userTests = userTestRepository.findByTestId(testId);
        for (UserTest ut : userTests) {
            List<UserAnswer> uas = userAnswerRepository.findByUserTestId(ut.getUserTestId());
            if (!uas.isEmpty()) userAnswerRepository.deleteAll(uas);
        }
        if (!userTests.isEmpty()) userTestRepository.deleteAll(userTests);

        List<TestPart> parts = testPartRepository.findByTestId(testId);
        for (TestPart p : parts) {
            testQuestionRepository.deleteByTestPartId(p.getTestPartId());
        }

        if (!parts.isEmpty()) testPartRepository.deleteAll(parts);

        testRepository.deleteById(testId);
    }

    public Test updateTest(String id, CreateTestRequest request, String currentUserId) {

        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }

        String effectiveClassId = request.getClassId() != null ? request.getClassId() : test.getClassId();
        String effectiveChapterId = request.getChapterId() != null ? request.getChapterId() : test.getChapterId();
        if (request.getClassId() != null) {
            classAccessGuard.requireTeacher(effectiveClassId, currentUserId);
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

        if (request.getExamCategoryId() != null) {
            test.setExamCategoryId(sanitizeExamCategoryId(request.getExamCategoryId()));
        }

        if (request.getCollectionId() != null) {
            test.setCollectionId(request.getCollectionId().isBlank() ? null : request.getCollectionId());
        }
        if (request.getAvailableFrom() != null) test.setAvailableFrom(request.getAvailableFrom());
        if (request.getAvailableTo() != null) test.setAvailableTo(request.getAvailableTo());

        if (request.getCostCoins() != null) {
            boolean publicTest = effectiveClassId == null;
            test.setCostCoins(authUtils.hasPermission(PermissionCatalog.TEST_MANAGE_PRICING) && publicTest ? request.getCostCoins() : null);
        }
        return testRepository.save(test);
    }
}
