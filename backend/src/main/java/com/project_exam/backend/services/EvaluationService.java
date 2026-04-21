package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.EvaluationRequest;
import com.project_exam.backend.dto.response.EvaluationResponse;
import com.project_exam.backend.models.Evaluation;
import com.project_exam.backend.models.User;
import com.project_exam.backend.repositories.EvaluationRepository;
import com.project_exam.backend.repositories.UserRepository;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final AuthUtils authUtils;

    // ============================
    // ✅ Helper convert Entity → DTO
    // ============================
    private EvaluationResponse toResponse(Evaluation e) {

        User user = userRepository.findById(e.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new EvaluationResponse(
                e.getId(),
                e.getContent(),
                e.getRating(),
                e.getCreatedAt(),

                user.getUserId(),
                user.getUserName(),
                user.getAvatarUrl()
        );
    }

    // ============================
    // ✅ CREATE
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
    // ✅ GET ALL
    // ============================
    public List<EvaluationResponse> getAll() {
        return evaluationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    // ✅ GET BY USER
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
    // ✅ UPDATE
    // ============================
    public EvaluationResponse update(String id, EvaluationRequest request) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));
        if (request.getContent() != null) evaluation.setContent(request.getContent());
        if (request.getRating() != null) evaluation.setRating(request.getRating());
        return toResponse(evaluationRepository.save(evaluation));
    }

    public EvaluationResponse getById(String id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));
        return toResponse(evaluation);
    }

    public void delete(String id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));
        evaluationRepository.delete(evaluation);
    }
}
