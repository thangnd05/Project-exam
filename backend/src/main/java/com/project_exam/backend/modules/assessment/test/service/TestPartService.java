package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;

import com.project_exam.backend.modules.assessment.test.dto.TestPartRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSimpleResponse;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.Optional;

@Service
@AllArgsConstructor
public class TestPartService {

    private final TestPartRepository testPartRepository;
    private final TestRepository testRepository;
    private final AuthUtils authUtils;

    private TestPartSimpleResponse toResponse(TestPart testPart) {
        return new TestPartSimpleResponse(
                testPart.getTestPartId(),
                testPart.getTestId(),
                testPart.getExamPartId(),
                testPart.getNumQuestions()
        );
    }

    public List<TestPart> findAll() {
        return testPartRepository.findAll();
    }

    public List<TestPartSimpleResponse> findAllResponses() {
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<TestPart> findById(String id) {
        return testPartRepository.findById(id);
    }

    public Optional<TestPartSimpleResponse> findResponseById(String id) {
        return findById(id).map(this::toResponse);
    }

    public List<TestPart> findByTestId(String testId) {
        return testPartRepository.findByTestId(testId);
    }

    public List<TestPartSimpleResponse> findResponsesByTestId(String testId) {
        return findByTestId(testId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TestPart save(TestPartRequest dto, HttpServletRequest request) {
        // Kiểm tra logic trước khi lưu
        if (dto.getTestId() == null) {
            throw new BadRequestException("Test ID không được để trống!");
        }

        Test test = testRepository.findById(dto.getTestId())
                .orElseThrow(() -> new NotFoundException("Bài test không tồn tại!"));

        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ForbiddenException("Chưa xác định được người dùng.");
        }
        boolean isOwner = currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(request)) {
            throw new ForbiddenException("Bạn không có quyền tạo part cho đề này.");
        }

        // Map từ DTO sang Entity
        TestPart testPart = new TestPart();
        testPart.setTestId(dto.getTestId());
        testPart.setExamPartId(dto.getExamPartId());
        testPart.setNumQuestions(dto.getNumQuestions());

        return testPartRepository.save(testPart);
    }

    @Transactional
    public TestPartSimpleResponse saveResponse(TestPartRequest dto, HttpServletRequest request) {
        return toResponse(save(dto, request));
    }

    @Transactional
    public TestPart update(String id, TestPartRequest dto, HttpServletRequest request) {
        TestPart existing = testPartRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Part để cập nhật"));

        Test test = testRepository.findById(existing.getTestId())
                .orElseThrow(() -> new NotFoundException("Bài test không tồn tại!"));

        String currentUserId = authUtils.getUserId(request);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(request)) {
            throw new ForbiddenException("Bạn không có quyền sửa part của đề này.");
        }

        existing.setExamPartId(dto.getExamPartId());
        existing.setNumQuestions(dto.getNumQuestions());
        // Thường không update testId vì nó cố định theo đề

        return testPartRepository.save(existing);
    }

    @Transactional
    public TestPartSimpleResponse updateResponse(String id, TestPartRequest dto, HttpServletRequest request) {
        return toResponse(update(id, dto, request));
    }

    @Transactional
    public void deleteById(String id, HttpServletRequest request) {
        TestPart existing = testPartRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Part để xóa"));
        Test test = testRepository.findById(existing.getTestId())
                .orElseThrow(() -> new NotFoundException("Bài test không tồn tại!"));

        String currentUserId = authUtils.getUserId(request);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(request)) {
            throw new ForbiddenException("Bạn không có quyền xóa part của đề này.");
        }

        testPartRepository.deleteById(id);
    }
}