package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationStatusResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationTestStatsResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.assessment.attempt.mapper.EvaluationMapper;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.assessment.attempt.repository.EvaluationRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Đánh giá đề sau khi làm full: mỗi user một lần cho mỗi đề, chỉ admin xem được.
 */
@Service
@RequiredArgsConstructor
public class EvaluationService {

    /** Giá trị lọc testId để lấy các đánh giá chung cũ (không gắn đề). */
    public static final String GENERAL_FILTER = "general";

    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final UserTestRepository userTestRepository;
    private final EvaluationMapper evaluationMapper;

    public EvaluationResponse create(String currentUserId, EvaluationRequest request) {
        String testId = request.getTestId();
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đề"));

        int completedFull = userTestRepository.countCompletedExcludingMode(
                currentUserId, testId, UserTest.Status.COMPLETED, UserTest.Mode.PRACTICE);
        if (completedFull == 0) {
            throw new ForbiddenException("Bạn cần hoàn thành đề ở chế độ làm full trước khi đánh giá.");
        }
        if (evaluationRepository.existsByUserIdAndTestId(currentUserId, testId)) {
            throw new ConflictException("Bạn đã đánh giá đề này rồi.");
        }

        Evaluation evaluation = new Evaluation();
        evaluation.setUserId(currentUserId);
        evaluation.setTestId(testId);
        String content = request.getContent();
        evaluation.setContent(content == null || content.isBlank() ? null : content.trim());
        evaluation.setRating(request.getRating());

        Evaluation saved;
        try {
            saved = evaluationRepository.saveAndFlush(evaluation);
        } catch (DataIntegrityViolationException e) {
            // Hai request gửi cùng lúc: unique index (user_id, test_id) chặn bản thứ hai.
            throw new ConflictException("Bạn đã đánh giá đề này rồi.");
        }

        User user = userRepository.findById(currentUserId).orElse(null);
        return evaluationMapper.toResponse(saved, user, test);
    }

    public EvaluationStatusResponse getStatus(String currentUserId, String testId) {
        return new EvaluationStatusResponse(evaluationRepository.existsByUserIdAndTestId(currentUserId, testId));
    }

    public PageResponse<EvaluationResponse> getAllPaged(Integer page, Integer size, String keyword,
                                                        Integer rating, String testId) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Evaluation> specification = Specification.unrestricted();

        if (keyword != null && !keyword.trim().isEmpty()) {
            String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("content")), normalizedKeyword)
            );
        }

        if (rating != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("rating"), rating));
        }

        if (testId != null && !testId.isBlank()) {
            specification = GENERAL_FILTER.equals(testId)
                    ? specification.and((root, query, cb) -> cb.isNull(root.get("testId")))
                    : specification.and((root, query, cb) -> cb.equal(root.get("testId"), testId));
        }

        Page<Evaluation> evaluationPage = evaluationRepository.findAll(specification, pageable);

        Map<String, User> users = userRepository.findAllById(evaluationPage.getContent().stream()
                        .map(Evaluation::getUserId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(User::getUserId, Function.identity()));
        Map<String, Test> tests = testRepository.findAllById(evaluationPage.getContent().stream()
                        .map(Evaluation::getTestId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Test::getTestId, Function.identity()));

        return PageResponse.from(evaluationPage, e ->
                evaluationMapper.toResponse(e, users.get(e.getUserId()),
                        e.getTestId() != null ? tests.get(e.getTestId()) : null));
    }

    public List<EvaluationTestStatsResponse> getStatsByTest() {
        return evaluationRepository.findStatsByTest();
    }

    public void delete(String id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        evaluationRepository.delete(evaluation);
    }
}
