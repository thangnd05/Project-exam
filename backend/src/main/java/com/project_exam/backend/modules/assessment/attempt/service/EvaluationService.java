package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.EvaluationResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.Evaluation;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.assessment.attempt.repository.EvaluationRepository;
import com.project_exam.backend.modules.users.repository.UserRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final AuthUtils authUtils;

    // ============================
    //  Helper convert Entity → DTO
    // ============================
    private EvaluationResponse toResponse(Evaluation e) {

        User user = userRepository.findById(e.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        return EvaluationResponse.builder()
                .id(e.getId())
                .content(e.getContent())
                .rating(e.getRating())
                .createdAt(e.getCreatedAt())

                .userId(user.getUserId())
                .username(user.getUserName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    // ============================
    //  CREATE
    // ============================
    public EvaluationResponse create(HttpServletRequest httpRequest, EvaluationRequest request) {

        String currentUserId = authUtils.getUserId(httpRequest);

        Evaluation evaluation = new Evaluation();
        evaluation.setUserId(currentUserId);
        evaluation.setContent(request.getContent());
        evaluation.setRating(request.getRating());

        Evaluation saved = evaluationRepository.save(evaluation);

        return toResponse(saved);
    }

    // ============================
    //  GET ALL
    // ============================
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

    // ============================
    //  GET BY USER
    // ============================
    public List<EvaluationResponse> getByUser(String userId) {
        return evaluationRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<EvaluationResponse> getMyEvaluations(HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        return evaluationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    //  UPDATE
    // ============================
    public EvaluationResponse update(String id, EvaluationRequest request, HttpServletRequest httpRequest) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        // 🔒 Chỉ chính chủ (hoặc admin) mới được sửa.
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(evaluation.getUserId());
        if (!isOwner && !authUtils.isAdmin(httpRequest)) {
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

    public void delete(String id, HttpServletRequest httpRequest) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));
        // 🔒 Chỉ chính chủ (hoặc admin) mới được xoá.
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(evaluation.getUserId());
        if (!isOwner && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn không có quyền xoá đánh giá này.");
        }
        evaluationRepository.delete(evaluation);
    }
}
