package com.project_exam.backend.modules.assessment.attempt.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.assessment.attempt.mapper.EvaluationMapper;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.assessment.attempt.repository.EvaluationRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final AuthUtils authUtils;
    private final EvaluationMapper evaluationMapper;

    private EvaluationResponse toResponse(Evaluation e) {

        User user = userRepository.findById(e.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        return evaluationMapper.toResponse(e, user);
    }

    public EvaluationResponse create(String currentUserId, EvaluationRequest request) {

        Evaluation evaluation = new Evaluation();
        evaluation.setUserId(currentUserId);
        evaluation.setContent(request.getContent());
        evaluation.setRating(request.getRating());

        Evaluation saved = evaluationRepository.save(evaluation);

        return toResponse(saved);
    }

    public List<EvaluationResponse> getAll() {
        return evaluationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PageResponse<EvaluationResponse> getAllPaged(Integer page, Integer size, String keyword, Integer rating) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 100);

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Evaluation> specification = Specification.where(null);

        if (keyword != null && !keyword.trim().isEmpty()) {
            String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("content")), normalizedKeyword)
            );
        }

        if (rating != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("rating"), rating));
        }

        Page<Evaluation> evaluationPage = evaluationRepository.findAll(specification, pageable);

        return PageResponse.from(evaluationPage, this::toResponse);
    }

    public List<EvaluationResponse> getByUser(String userId) {
        return evaluationRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<EvaluationResponse> getMyEvaluations(String currentUserId) {
        return evaluationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EvaluationResponse update(String id, EvaluationRequest request, String currentUserId) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        boolean isOwner = currentUserId != null && currentUserId.equals(evaluation.getUserId());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.EVALUATION_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đánh giá này.");
        }
        if (request.getContent() != null) evaluation.setContent(request.getContent());
        if (request.getRating() != null) evaluation.setRating(request.getRating());
        return toResponse(evaluationRepository.save(evaluation));
    }

    public EvaluationResponse getById(String id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        return toResponse(evaluation);
    }

    public void delete(String id, String currentUserId) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        boolean isOwner = currentUserId != null && currentUserId.equals(evaluation.getUserId());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.EVALUATION_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xoá đánh giá này.");
        }
        evaluationRepository.delete(evaluation);
    }
}
