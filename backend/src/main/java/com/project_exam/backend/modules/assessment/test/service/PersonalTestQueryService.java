package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalTestQueryService {

    private final TestRepository testRepository;
    private final TestSummaryAssembler summaryAssembler;

    public List<TestResponse> getTestsByUser(String currentUserId) {
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }
        return summaryAssembler.buildUserTestSummariesBatch(testRepository.findByCreatedBy(currentUserId), currentUserId);
    }

    public List<TestResponse> getTestByCreateBy(String currentUserId) {
        if (currentUserId == null) {
            throw new UnauthorizedException("Bạn cần đăng nhập để xem bài kiểm tra.");
        }
        return summaryAssembler.buildUserTestSummariesBatch(testRepository.findByCreatedBy(currentUserId), currentUserId);
    }

    public List<TestResponse> getMyPersonalTests(String currentUserId) {
        if (currentUserId == null) {
            throw new UnauthorizedException("Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        List<Test> tests = testRepository.findByCreatedByAndClassIdIsNullAndChapterIdIsNull(currentUserId);
        return summaryAssembler.buildUserTestSummariesBatch(tests, currentUserId);
    }

    public PageResponse<TestResponse> getMyPersonalTestsPaged(String currentUserId, int page, int size) {
        if (currentUserId == null) {
            throw new UnauthorizedException("Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Test> testPage = testRepository
                .findByCreatedByAndClassIdIsNullAndChapterIdIsNull(currentUserId, pageable);

        return summaryAssembler.toTestPageResponse(testPage, currentUserId);
    }
}
